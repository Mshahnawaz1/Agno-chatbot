from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


def normalize_email(email: str) -> str:
    """One canonical form, so A@x.com and a@x.com can't become two accounts."""
    return email.strip().lower()


class UserCreate(BaseModel):
    # Light shape check; swap for pydantic's EmailStr if you install email-validator.
    email: str = Field(max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    name: str | None = Field(default=None, max_length=100)
    # max_length also caps how much hashing work one request can cause
    password: str = Field(min_length=8, max_length=128)

    # mode="before": normalize first, then the pattern/length checks run on the result
    @field_validator("email", mode="before")
    @classmethod
    def _normalize_email(cls, v):
        return normalize_email(v) if isinstance(v, str) else v


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
    metrics: dict

class ChatRequest(BaseModel):
    """A typed message, or a click on an A2UI surface (a v1.0 renderer-to-agent `action` message)."""
    message: str | None = Field(default=None, min_length=1, max_length=4000)  # rejects empty / huge input
    action: dict[str, Any] | None = None
    session_id: str | None = None

    @model_validator(mode="after")
    def one_input(self):
        if (self.message is None) == (self.action is None):
            raise ValueError("Send either a message or an action.")
        return self


class MessageOut(BaseModel):
    role: str
    content: str
    metrics: dict | None = None  # assistant replies only
    # Assistant replies: what the turn showed, in order ({"type": "text" | "a2ui", ...}).
    parts: list[dict[str, Any]] | None = None
    # Assistant replies: the model's thoughts before/while answering, if it shared any.
    reasoning: str | None = None
    # User turns started by a click: the action that was sent.
    action: dict[str, Any] | None = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ConnectorOut(BaseModel):
    id: str
    name: str
    notes: str
    url: str
    scopes: list[str]
    tools: list[str] | None  # None = every tool the server offers
    connected: bool  # the user has logged in / saved a key
    enabled: bool  # connected and switched on, so the agent gets its tools
    skill: str | None  # its SKILL.md description; None = no skill for this connector


class SkillOut(BaseModel):
    name: str
    description: str
    allowed_tools: list[str]
    instructions: str  # SKILL.md body, markdown


class ConnectorUpdate(BaseModel):
    enabled: bool


class AuthorizeOut(BaseModel):
    url: str


class ApiKeyIn(BaseModel):
    api_key: str = Field(min_length=1, max_length=2000)
