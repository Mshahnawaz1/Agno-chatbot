from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str
    name: str | None = None


class UserOut(BaseModel):
    id: str
    email: str
    name: str | None
    created_at: str


class SessionCreate(BaseModel):
    title: str | None = None


class SessionOut(BaseModel):
    id: str
    user_id: str
    title: str | None
    created_at: str


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None   # None => start a new chat


class ChatResponse(BaseModel):
    session_id: str
    run_id: str
    content: str