from pydantic import BaseModel, Field


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
    updated_at: str


class ChatResponse(BaseModel):
    session_id: str
    run_id: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)   # rejects empty / huge input
    session_id: str | None = None


class MessageOut(BaseModel):
    role: str
    content: str

class UserCreate(BaseModel):
    email: str
    name: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"