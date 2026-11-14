import json
import logging
from collections.abc import AsyncIterator

from agno.agent import RunEvent
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from app import db
from app.agent import agent
from app.deps import CurrentUser
from app.schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


def make_title(text: str, limit: int = 40) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0] + "…"


def resolve_session(body: ChatRequest, user: dict) -> dict:
    """None => new chat. A given id must exist AND belong to this user, else 404."""
    if body.session_id is None or len(body.session_id) == 0:
        return db.create_chat_session(user["id"], make_title(body.message))
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


@router.post("/stream")
async def chat_stream(body: ChatRequest, user: CurrentUser):
    session = resolve_session(body, user)      # 404 is raised here, before streaming

    async def event_stream() -> AsyncIterator[str]:
        run_id = None
        tools = []
        final_metrics = None
        yield sse("session", {"session_id": session["id"]})
        try:
            async for event in agent.arun(
                body.message,
                user_id=user["id"],
                session_id=session["id"],
                stream=True,
                stream_events=True,
                metadata={"query": body.message},  # lets the tool router see the message
            ):
                if event.event == RunEvent.run_error:
                    # Guardrail failures (InputCheckError/OutputCheckError) arrive here as
                    # an event, not as a raised exception.
                    logger.warning("run error: %s (%s)", event.content, getattr(event, "error_type", None))
                    yield sse("guardrail_error", {
                        "message": str(event.content),
                        "type": getattr(event, "error_type", None),
                    })
                    return  # stop streaming; finally still touches the session
                if event.event == RunEvent.run_content:
                    run_id = run_id or event.run_id
                    if event.content:
                        yield sse("token", {"content": str(event.content)})
                elif event.event == RunEvent.tool_call_completed:
                    tools.append(event.tool)

                elif event.event == RunEvent.run_completed:
                    run_id = run_id or event.run_id
                    final_metrics = run_metrics(event.metrics, tools)
                    log_run(run_id, event.metrics, tools)

            if final_metrics:
                yield sse("metrics", final_metrics)
            yield sse("done", {"run_id": run_id})
        except Exception as e:
            logger.exception("stream failed")
            yield sse("error", {"message": f"Generation failed. Error {e}"})
        finally:
            db.touch_chat_session(session["id"])

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}, #-Accel- Buffering=yes allows middlewares to store the data and send all at the same time. 
    )