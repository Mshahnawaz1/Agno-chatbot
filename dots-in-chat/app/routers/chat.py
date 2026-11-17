import asyncio
import json
import logging
from collections.abc import AsyncIterator

from agno.agent import RunEvent
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app import db
from app.a2ui.actions import InvalidAction, action_prompt, read_action
from typing import Any

from pydantic import BaseModel

from app.a2ui import capabilities, rpc
from app.a2ui.catalog import new_processor
from app.a2ui.feedback import InvalidError, data_model_context, error_prompt, negotiate, read_data_model, read_errors
from app.a2ui.store import load_state
from app.a2ui.turn import A2uiTurn
from app.agent import agent
from app.agent.title import generate_title
from app.deps import CurrentUser
from app.schemas import ChatRequest, ChatResponse
from app.skills import stub_skill_loads

logger = logging.getLogger(__name__)
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
    model_input: str, user: dict, session_id: str, turn: A2uiTurn, run: dict, repair: bool = False,
    hidden_input: bool = False, context: dict | None = None,
) -> AsyncIterator[str]:
    """One agent run streamed through the A2UI compiler. Fills `run` with its outcome."""
    turn.start_pass()
    # `query` lets the tool router pick connector tools for the message. A repair run only fixes
    # UI, so it gets none: routing its prompt ("create ... form") attached unrelated tools.
    metadata = {"query": "" if repair or hidden_input else model_input}
    if repair:
        metadata["a2ui_repair"] = True  # hidden from the history endpoint
    if hidden_input:
        metadata["a2ui_hidden_input"] = True  # the run shows, its input (errors, a function result) doesn't
    # `context` is extra input for this turn only (agno `dependencies`); the stored input stays clean.
    extra = {"dependencies": context, "add_dependencies_to_context": True} if context else {}
    async for event in agent.arun(
        model_input, user_id=user["id"], session_id=session_id,
        stream=True, stream_events=True, metadata=metadata, **extra,
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
        elif event.event == RunEvent.run_completed:
            run["run_id"] = run.get("run_id") or event.run_id
            run["all_ids"].append(event.run_id)
            if not repair:
                run["metrics"] = run_metrics(event.metrics, run["tools"])
            log_run(event.run_id, event.metrics, run["tools"])
    for name, data in turn.close():
        yield sse(name, data)


_DONE = object()


async def with_outbox(passes: AsyncIterator[str], outbox: asyncio.Queue) -> AsyncIterator[str]:
    """The model pass's SSE chunks, plus whatever tools put in `outbox` while the pass waits
    (a tool that calls the browser blocks the pass, so its message must not wait behind it)."""

    async def pump() -> None:
        try:
            async for chunk in passes:
                await outbox.put(chunk)
        finally:
            await outbox.put(_DONE)

    task = asyncio.create_task(pump())
    try:
        while (item := await outbox.get()) is not _DONE:
            yield item if isinstance(item, str) else sse(*item)
    finally:
        task.cancel()  # the client left: stop the model run
        await asyncio.gather(task, return_exceptions=True)
    if not task.cancelled() and task.exception():
        raise task.exception()


class RpcRequest(BaseModel):
    session_id: str
    message: dict[str, Any]


@router.post("/rpc")
async def chat_rpc(body: RpcRequest, user: CurrentUser):
    """Renderer-to-agent function RPC: a `callAgentFunction` (answered here, in `replies`) or a
    `rendererFunctionResponse` (settles the call a tool is waiting for). `handled` is false for a
    response nobody was waiting for."""
    if db.get_chat_session(body.session_id, user["id"]) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    try:
        return await rpc.handle(body.session_id, body.message)
    except Exception as e:  # A2uiValidationError: not a v1.0 RPC message
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid RPC message: {e}")


@router.post("/stream")
async def chat_stream(body: ChatRequest, user: CurrentUser):
    is_new = not body.session_id
    if (body.errors is not None or body.function_response is not None) and is_new:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Renderer messages belong to an existing chat")
    caps = None
    if body.renderer_capabilities is not None:  # the renderer's handshake; else the default catalog
        try:
            caps = negotiate(body.renderer_capabilities)
        except InvalidError as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    session = resolve_session(body, user)      # 404 is raised here, before streaming
    # A new chat gets an LLM-written title, generated alongside the first reply.
    title_task = asyncio.create_task(generate_title(body.message)) if is_new and body.message else None
    with capabilities.use(caps):  # every processor this turn makes is bound to them
        turn = A2uiTurn(session["id"])
    if body.action is not None:
        try:
            action = await read_action(body.action)  # a bad action is a plain 400
        except InvalidAction as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid action: {e}")
        prompt = action_prompt(action, turn.surface_ids)
    elif body.errors is not None:
        try:
            errors = await read_errors(body.errors)
        except InvalidError as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid error: {e}")
        logger.warning("renderer errors in session %s: %s", session["id"], errors)
        prompt = error_prompt(errors, turn.surface_ids)
    elif body.function_response is not None:
        try:
            prompt = rpc.result_prompt(rpc.read_result(body.function_response))
        except InvalidError as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid function response: {e}")
    else:
        prompt = body.message
    hidden = body.errors is not None or body.function_response is not None  # the user typed nothing
    outbox: asyncio.Queue = asyncio.Queue()

    context = None
    if body.renderer_data_model is not None:
        try:
            with capabilities.use(caps):
                state = load_state(session["id"], new_processor())
            context = data_model_context(read_data_model(body.renderer_data_model, state))
        except InvalidError as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

    async def event_stream() -> AsyncIterator[str]:
        # run_id is the reply's run: the repair run's parts are stored under it too.
        run: dict = {"run_id": None, "all_ids": [], "tools": [], "metrics": None, "stopped": False}
        yield sse("session", {"session_id": session["id"]})
        # Tools that call the browser (call_renderer_function) put their messages here.
        rpc.open_stream(session["id"], outbox)
        try:
            model_input, repair = prompt, False
            for attempt in range(REPAIR_ATTEMPTS + 1):
                pass_ = model_pass(
                    model_input, user, session["id"], turn, run, repair,
                    hidden_input=hidden and not repair, context=None if repair else context,
                )
                async for chunk in with_outbox(pass_, outbox):
                    yield chunk
                if turn.rejected and not run["stopped"]:
                    for name, data in turn.autofix():  # `name: value` arguments: no model call
                        yield sse(name, data)
                if run["stopped"] or not turn.rejected or attempt == REPAIR_ATTEMPTS:
                    break
                yield sse("a2ui_repair", {"attempt": attempt + 1})
                model_input, repair = turn.repair_prompt(), True
            if run["stopped"]:
                return
            if turn.rejected:  # still rejected after the repairs: say so instead of "here it is"
                for name, data in turn.give_up():
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
            rpc.close_stream(session["id"])
            turn.save(run["run_id"])
            if title_task:
                try:
                    if title := await title_task:
                        db.set_chat_session_title(session["id"], title)
                except Exception:
                    logger.exception("could not set the chat title")
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
