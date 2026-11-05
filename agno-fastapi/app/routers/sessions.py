from fastapi import APIRouter, HTTPException, status

from app import db
from app.deps import CurrentUser
from app.schemas import SessionCreate, SessionOut, MessageOut
from app.agent import agent

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

    messages = await agent.aget_chat_history(session_id=session_id)

    out = []
    for m in messages or []:
        if m.role not in ("user", "assistant"):
            continue
        content = m.content if isinstance(m.content, str) else str(m.content or "")
        if content:
            out.append(MessageOut(role=m.role, content=content))
    return out