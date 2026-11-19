import asyncio
from agno.run.base import HISTORY_SKIP_STATUSES
from fastapi import APIRouter, HTTPException, status

from app import db
from app.a2ui.actions import parse_action_prompt
from app.a2ui.store import parts_by_run
from app.attachments import split_attachments
from app.deps import CurrentUser
from app.schemas import SessionCreate, SessionOut, MessageOut
from app.agent import agent
from app.agent.sources import build_sources
from app.routers.chat import run_metrics

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def new_session(body: SessionCreate, user: CurrentUser):
    return db.create_chat_session(user["id"], body.title)


@router.get("", response_model=list[SessionOut])
def my_sessions(user: CurrentUser):
    return db.list_chat_sessions(user["id"])


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: str, user: CurrentUser):
    session = db.get_chat_session(session_id, user["id"])
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str, user: CurrentUser):
    # Ownership check FIRST: Agno's delete takes only a session_id here.
    if db.get_chat_session(session_id, user["id"]) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    await agent.adelete_session(session_id=session_id, user_id=user["id"])  # agno.db runs
    db.delete_chat_session(session_id, user["id"])  # app db row + chat_parts


@router.get("/{session_id}/messages", response_model=list[MessageOut])
async def session_messages(session_id: str, user: CurrentUser):
    # Ownership check FIRST: Agno's history call takes only a session_id.
    session = db.get_chat_session(session_id, user["id"])
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")

    # Read runs (not plain chat history) because each run also stores its metrics
    # and tool calls, so the frontend can show the Metrics button for old replies.
    agno_session = await agent.aget_session(session_id=session_id)
    runs = [
        r for r in (agno_session.runs if agno_session else None) or []
        if r.parent_run_id is None and r.status not in HISTORY_SKIP_STATUSES  # same filter as chat history
        and not (r.metadata or {}).get("a2ui_repair")  # a hidden A2UI correction run
    ]
    parts = parts_by_run(session_id)

    out = []
    for run in runs:
        text = run.input.input_content_string() if run.input else ""
        if text:
            action = parse_action_prompt(text)
            text, attached = split_attachments(text)
            out.append(MessageOut(
                role="user", content="" if action else text, action=action, attachments=attached or None,
            ))
        turn_parts = parts.get(run.run_id)
        if turn_parts or run.content:
            out.append(MessageOut(
                role="assistant",
                # Replies stored before A2UI v1.0 have no parts: their raw text is all there is.
                content="".join(p["text"] for p in turn_parts if p["type"] == "text") if turn_parts else str(run.content),
                parts=turn_parts,
                metrics=run_metrics(run.metrics, run.tools),
                reasoning=run.reasoning_content or None,
                sources=await asyncio.to_thread(
                    build_sources, run.references, str(run.content or ""), user["id"]
                ) or None,
            ))
    return out
