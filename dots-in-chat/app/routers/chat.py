import asyncio
import json
import logging
from collections.abc import AsyncIterator

from agno.agent import RunEvent
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app import db
from app.a2ui.actions import InvalidAction, action_prompt, read_action
from app.a2ui.turn import A2uiTurn
from app.agent import agent
from app.deps import CurrentUser
from app.schemas import ChatRequest, ChatResponse
from app.agent.skills import stub_skill_loads
from app.agent.titles import generate_title

logger = logging.getLogger(__name__)

# How long the end of a stream waits for the generated title before keeping the fallback.
TITLE_WAIT_SECONDS = 5
router = APIRouter(prefix="/chat", tags=["chat"])

# A reply whose A2UI block the compiler rejects gets this many hidden runs to correct it.
REPAIR_ATTEMPTS = 2  # the A2UI docs' validate-and-retry loop uses 2 retries

# agno's error types for guardrail checks; any other run error is a failure, not a block.
GUARDRAIL_ERRORS = {"input_check_error", "output_check_error"}


def make_title(text: str, limit: int = 40) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0] + "…"


def resolve_session(body: ChatRequest, user: dict) -> dict:
    """None => new chat. A given id must exist AND belong to this user, else 404."""
    if body.session_id is None or len(body.session_id) == 0:
        title = body.message or str((body.action or {}).get("action", {}).get("name", "New chat"))
        return db.create_chat_session(user["id"], make_title(title))
    session = db.get_chat_session(body.session_id, user["id"])
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session


def run_metrics(metrics, tools) -> dict:
    """Metrics shape the frontend expects. Shared with the session history endpoint."""
    out = metrics.to_dict() if metrics else {}
    tools = tools or []
    out["num_tools"] = len(tools)
    out["tools"] = [{"name": t.tool_name, "args": t.tool_args, "result": t.result} for t in tools]
    return out


def log_run(run_id, metrics, tools) -> None:
    """One line per run: what it cost and which tools it called. Tune routing from these."""
    if metrics is None:
        return
    logger.info(
        "run %s done: in=%s out=%s %.1fs ttft=%.1fs tools=[%s]",
        (run_id or "?")[:8], metrics.input_tokens, metrics.output_tokens,
        metrics.duration or 0, metrics.time_to_first_token or 0,
        ",".join(t.tool_name for t in tools or []),
    )


def file_event(tool, seen: set) -> dict | None:
    """The `file` SSE payload for a completed file tool call, or None for any other call or a failed one.

    "created" vs "updated" can't be known after the fact, so: save_file is "created" the first time
    a path is seen in this stream and "updated" after that; replace_file_chunk is always "updated";
    build_docx is "created" for the first sighting of its .docx and "updated" after. `seen` is
    per-stream state (a file overwritten by save_file in a later chat turn reads "created" again).
    """
    name = getattr(tool, "tool_name", None)
    args = getattr(tool, "tool_args", None) or {}
    result = str(getattr(tool, "result", "") or "")
    if name == "save_file":
        path = args.get("file_name")
    elif name == "replace_file_chunk":
        path = args.get("file_name")
    elif name == "build_docx":
        path = result  # build_docx returns the .docx name it wrote
    elif name == "delete_file":
        path = args.get("file_name")
    else:
        return None
    if not isinstance(path, str) or not path:
        return None
    if name == "delete_file":
        failed = bool(result)  # empty result = success
    else:
        failed = result.startswith(("Error", "Incorrect")) or "already exists" in result
    if failed:
        return None
    path = path.replace("\\", "/")
    kind = "docx" if path.lower().endswith(".docx") else "md" if path.lower().endswith(".md") else "file"
    if name == "delete_file":
        action = "deleted"
        seen.discard(path)
    elif name == "replace_file_chunk":
        action = "updated"
        seen.add(path)
    else:
        action = "updated" if path in seen else "created"
        seen.add(path)
    return {"path": path, "kind": kind, "action": action}


def sse(event: str, data: dict) -> str:
    # json.dumps keeps newlines inside tokens from breaking the SSE framing
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest, user: CurrentUser):
    """Plain request/response, no A2UI compiling: typed messages only (the UI uses /stream)."""
    if body.message is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Actions go through /chat/stream")
    session = resolve_session(body, user)
    try:
        run = await agent.arun(
            body.message, user_id=user["id"], session_id=session["id"],
            metadata={"query": body.message},  # lets the tool router see the message
        )
    except Exception:
        logger.exception("agent run failed")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "The model call failed")
    db.touch_chat_session(session["id"])
    log_run(run.run_id, run.metrics, run.tools)

    return ChatResponse(
        session_id=session["id"], run_id=run.run_id, content=run.content or "",
        metrics=run_metrics(run.metrics, run.tools),
    )


async def model_pass(
    model_input: str, user: dict, session_id: str, turn: A2uiTurn, run: dict, repair: bool = False
) -> AsyncIterator[str]:
    """One agent run streamed through the A2UI compiler. Fills `run` with its outcome."""
    turn.start_pass()
    # `query` lets the tool router pick connector tools for the message. A repair run only fixes
    # UI, so it gets none: routing its prompt ("create ... form") attached unrelated tools.
    metadata = {"query": "" if repair else model_input}
    if repair:
        metadata["a2ui_repair"] = True  # hidden from the history endpoint
    async for event in agent.arun(
        model_input, user_id=user["id"], session_id=session_id,
        stream=True, stream_events=True, metadata=metadata,
    ):
        if event.event == RunEvent.run_error:
            # Guardrail failures (InputCheckError/OutputCheckError) and model/provider errors
            # both arrive here as an event, not as a raised exception.
            error_type = getattr(event, "error_type", None)
            logger.warning("run error: %s (%s)", event.content, error_type)
            run["stopped"] = True
            if error_type in GUARDRAIL_ERRORS:
                yield sse("guardrail_error", {"message": str(event.content), "type": error_type})
            else:
                yield sse("error", {"message": f"Generation failed. Error {event.content}"})
            return
        if event.event == RunEvent.run_content:
            run["run_id"] = run.get("run_id") or event.run_id
            # The model's thoughts (Gemini include_thoughts, Groq gpt-oss reasoning) arrive
            # before its answer; a repair run's thoughts are about fixing UI, so stay hidden.
            if event.reasoning_content and not repair:
                yield sse("reasoning", {"content": event.reasoning_content})
            if event.content:
                for name, data in turn.feed(str(event.content)):
                    yield sse(name, data)
        elif event.event == RunEvent.tool_call_completed:
            run["tools"].append(event.tool)
            payload = file_event(event.tool, run.setdefault("seen_files", set()))
            if payload:
                yield sse("file", payload)
        elif event.event == RunEvent.run_completed:
            run["run_id"] = run.get("run_id") or event.run_id
            run["all_ids"].append(event.run_id)
            if not repair:
                run["metrics"] = run_metrics(event.metrics, run["tools"])
            log_run(event.run_id, event.metrics, run["tools"])
    for name, data in turn.close():
        yield sse(name, data)
    # An update that dropped components becomes a new surface here, without another model call.
    for name, data in turn.replace_dropped_updates() or []:
        yield sse(name, data)


@router.post("/stream")
async def chat_stream(body: ChatRequest, user: CurrentUser):
    session = resolve_session(body, user)      # 404 is raised here, before streaming
    turn = A2uiTurn(session["id"])
    # New chat typed by the user: name it from the message's meaning, in parallel with the reply.
    # make_title's first-words title (set by resolve_session) stays if this fails or is slow.
    title_task = (
        asyncio.create_task(generate_title(body.message))
        if body.message and not body.session_id else None
    )
    if body.action is not None:
        try:
            action = await read_action(body.action)  # a bad action is a plain 400
        except InvalidAction as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid action: {e}")
        prompt = action_prompt(action, turn.surface_ids)
    else:
        prompt = body.message

    async def event_stream() -> AsyncIterator[str]:
        # run_id is the reply's run: the repair run's parts are stored under it too.
        run: dict = {"run_id": None, "all_ids": [], "tools": [], "metrics": None, "stopped": False}
        yield sse("session", {"session_id": session["id"]})
        try:
            model_input, repair = prompt, False
            for attempt in range(REPAIR_ATTEMPTS + 1):
                async for chunk in model_pass(model_input, user, session["id"], turn, run, repair):
                    yield chunk
                if run["stopped"] or not turn.rejected or attempt == REPAIR_ATTEMPTS:
                    break
                yield sse("a2ui_repair", {"attempt": attempt + 1})
                model_input, repair = turn.repair_prompt(), True
            if run["stopped"]:
                return
            if turn.rejected:  # every repair failed: say so instead of showing nothing
                for name, data in turn.fallback():
                    yield sse(name, data)
            for name, data in turn.finish():
                yield sse(name, data)
            if run["metrics"]:
                yield sse("metrics", run["metrics"])
            yield sse("done", {"run_id": run["run_id"]})
        except Exception as e:
            logger.exception("stream failed")
            yield sse("error", {"message": f"Generation failed. Error {e}"})
        finally:
            if title_task is not None:
                try:
                    title = await asyncio.wait_for(title_task, TITLE_WAIT_SECONDS)
                    if title:
                        db.set_chat_session_title(session["id"], title)
                except Exception:  # timeout, cancel or failure: keep the first-words title
                    title_task.cancel()
            turn.save(run["run_id"])
            try:
                await stub_skill_loads(agent, session["id"], run["all_ids"])
            except Exception:
                logger.exception("could not stub skill loads in history")
            db.touch_chat_session(session["id"])

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}, #-Accel- Buffering=yes allows middlewares to store the data and send all at the same time. 
    )
