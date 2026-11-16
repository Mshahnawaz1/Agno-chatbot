"""What each assistant turn showed, kept so surfaces survive reloads and later turns.

A turn's parts (text and A2UI wire messages, in order) are stored in the app database
(`chat_parts`). They serve two readers:
- the history endpoint, which returns them so the client can redraw the surfaces;
- the next turn, whose renderer state is rebuilt by replaying the session's A2UI messages, so
  the model can update or delete a surface an earlier turn created.
"""

import json
import logging
from collections import defaultdict
from typing import Any

from a2ui.processor import A2uiRequestProcessor
from a2ui.utils import RendererState

from app import db

logger = logging.getLogger(__name__)

Part = dict[str, Any]  # {"type": "text", "text": ...} | {"type": "a2ui", "message": {...}}


def save_parts(session_id: str, run_id: str, parts: list[Part]) -> None:
    rows = [
        ("text", p["text"]) if p["type"] == "text" else ("a2ui", json.dumps(p["message"]))
        for p in parts
    ]
    if rows:
        db.add_chat_parts(session_id, run_id, rows)


def parts_by_run(session_id: str) -> dict[str, list[Part]]:
    out: dict[str, list[Part]] = defaultdict(list)
    for row in db.list_chat_parts(session_id):
        if row["kind"] == "text":
            out[row["run_id"]].append({"type": "text", "text": row["payload"]})
        else:
            out[row["run_id"]].append({"type": "a2ui", "message": json.loads(row["payload"])})
    return out


def load_state(session_id: str, processor: A2uiRequestProcessor) -> RendererState:
    """The session's renderer state, rebuilt from every A2UI message it has shown."""
    state = processor.create_state()
    messages = [
        json.loads(row["payload"]) for row in db.list_chat_parts(session_id) if row["kind"] == "a2ui"
    ]
    if messages:
        try:
            state.apply(messages)
        except Exception:  # stored messages were valid when sent; don't fail the chat if not
            logger.exception("could not rebuild A2UI state for session %s", session_id)
            return processor.create_state()
    return state
