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


def sse(event: str, data: dict) -> str:
    # json.dumps keeps newlines inside tokens from breaking the SSE framing
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest, user: CurrentUser):
    session = resolve_session(body, user)
    try:
        run = await agent.arun(body.message, user_id=user["id"], session_id=session["id"])
    except Exception:
        logger.exception("agent run failed")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "The model call failed")
    db.touch_chat_session(session["id"])
    return ChatResponse(
        session_id=session["id"], run_id=run.run_id, content=run.content or ""
    )


@router.post("/stream")
async def chat_stream(body: ChatRequest, user: CurrentUser):
    session = resolve_session(body, user)      # 404 is raised here, before streaming

    async def event_stream() -> AsyncIterator[str]:
        run_id = None
        yield sse("session", {"session_id": session["id"]})
        try:
            async for event in agent.arun(
                body.message,
                user_id=user["id"],
                session_id=session["id"],
                stream=True,
            ):
                if event.event == RunEvent.run_content:
                    run_id = run_id or event.run_id
                    if event.content:
                        yield sse("token", {"content": str(event.content)})
            yield sse("done", {"run_id": run_id})
        except Exception:
            logger.exception("stream failed")
            yield sse("error", {"message": "Generation failed"})
        finally:
            db.touch_chat_session(session["id"])

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}, #-Accel- Buffering=yes allows middlewares to store the data and send all at the same time. 
    )