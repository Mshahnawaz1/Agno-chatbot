from fastapi import APIRouter, HTTPException, status

from app import db
from app.agent import agent
from app.deps import CurrentUser
from app.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


def make_title(text: str, limit: int = 40) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0] + "…"


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest, user: CurrentUser):
    if body.session_id is None or len(body.session_id) == 0: #adding len to check in the fastapi docs. 
        session = db.create_chat_session(user["id"], make_title(body.message))
    else:
        session = db.get_chat_session(body.session_id, user["id"])
        if session is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")

    run = await agent.arun(
        body.message,
        user_id=user["id"],
        session_id=session["id"],
    )
    db.touch_chat_session(session["id"])   # bump updated_at for the sidebar ordering

    return ChatResponse(
        session_id=session["id"],
        run_id=run.run_id,
        content=run.content or "",
    )