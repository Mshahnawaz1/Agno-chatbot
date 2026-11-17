"""Test harness: the real /chat/stream route with a scripted model.

`Harness.post(body)` sends a request and returns the SSE events it streamed. The model is a
`ScriptedAgent`: each run pops the next reply (a string, or a coroutine function for replies
that call tools) and records what the model was asked (`inputs`, `kwargs`). No network.
"""

import json
import os
import tempfile
from collections.abc import Callable
from types import SimpleNamespace

_tmp = tempfile.mkdtemp()
os.environ.setdefault("APP_DB_PATH", os.path.join(_tmp, "app.db"))
os.environ.setdefault("JWT_SECRET", "x" * 40)
os.environ.setdefault("CONNECTOR_SECRET", "A" * 43 + "=")

from agno.agent import RunEvent  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import db  # noqa: E402
from app.deps import get_current_user  # noqa: E402
from app.routers import chat  # noqa: E402

db.init_db()


class ScriptedAgent:
    """Stands in for the agno agent: replays scripted replies, records its inputs."""

    def __init__(self):
        self.replies: list[str | Callable] = []
        self.inputs: list[str] = []
        self.kwargs: list[dict] = []

    def arun(self, input, **kw):
        self.inputs.append(input)
        self.kwargs.append(kw)
        reply = self.replies.pop(0) if self.replies else ""
        run_id = f"run-{len(self.inputs)}"

        async def gen():
            if callable(reply):
                text = await reply(kw)
            else:
                text = reply
            for i in range(0, len(text), 11):
                yield SimpleNamespace(
                    event=RunEvent.run_content, content=text[i:i + 11], reasoning_content=None, run_id=run_id
                )
            yield SimpleNamespace(event=RunEvent.run_completed, run_id=run_id, metrics=None, content=None)

        return gen()


def sse_events(text: str) -> list[tuple[str, dict]]:
    out = []
    for block in text.split("\n\n"):
        if not block.strip():
            continue
        lines = dict(line.split(": ", 1) for line in block.split("\n") if ": " in line)
        out.append((lines["event"], json.loads(lines["data"])))
    return out


async def _no_stub(*a, **k):
    return None


async def _no_title(*a, **k):
    return None


class Harness:
    def __init__(self):
        self.agent = ScriptedAgent()
        self._saved = (chat.agent, chat.stub_skill_loads, chat.generate_title)
        chat.agent, chat.stub_skill_loads, chat.generate_title = self.agent, _no_stub, _no_title
        user = db.create_user(f"u{os.urandom(4).hex()}@x.io", None, "hash")
        self.user = user
        app = FastAPI()
        app.include_router(chat.router)
        app.dependency_overrides[get_current_user] = lambda: user
        self.app = app
        self.client = TestClient(app)

    def async_client(self):
        """An httpx client on the same app, for scenarios with two requests at once (a stream
        and the browser's RPC response). It returns a streamed body only when it has ended."""
        import httpx

        return httpx.AsyncClient(transport=httpx.ASGITransport(app=self.app), base_url="http://test")

    def close(self):
        chat.agent, chat.stub_skill_loads, chat.generate_title = self._saved

    def new_session(self) -> str:
        return db.create_chat_session(self.user["id"], "t")["id"]

    def post(self, body: dict, status: int = 200):
        res = self.client.post("/chat/stream", json=body)
        assert res.status_code == status, (res.status_code, res.text)
        return sse_events(res.text) if status == 200 else res.json()


def a2ui_kinds(events):
    return [k for n, d in events if n == "a2ui" for k in d["message"] if k != "version"]
