from agno.run.base import HISTORY_SKIP_STATUSES
from fastapi import APIRouter, HTTPException, status

from app import db
from app.deps import CurrentUser
from app.schemas import SessionCreate, SessionOut, MessageOut
from app.agent import agent
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
    ]

    out = []
    for run in runs:
        if run.input and run.input.input_content_string():
            out.append(MessageOut(role="user", content=run.input.input_content_string()))
        if run.content:
            out.append(MessageOut(
                role="assistant", content=str(run.content),
                metrics=run_metrics(run.metrics, run.tools),
            ))
    return out
