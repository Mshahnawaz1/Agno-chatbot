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
from app.a2ui.catalog import upgrade_message
from app.a2ui.macros import raise_message

logger = logging.getLogger(__name__)

Part = dict[str, Any]  # {"type": "text", "text": ...} | {"type": "a2ui", "message": {...}}


def _surface_of(message: dict, key: str) -> str | None:
    return (message.get(key) or {}).get("surfaceId")


def keep_earlier_surfaces(parts: list[Part]) -> list[Part]:
    """One turn's parts without the deletes that only clear the way for a new surface.

    Models delete the previous card whenever they show a new one (a chart after a form, a pie
    after a histogram), so earlier messages showed "This interface was removed". A turn that
    creates a surface keeps the earlier ones; only a delete-only turn ("remove the weather
    card") removes one. A delete followed by a create of the same id is a real replacement
    and stays. Applied to stored turns as well, so chats saved before this rule get their
    cards back.
    """
    created = [_surface_of(p["message"], "createSurface") for p in parts if p["type"] == "a2ui"]
    if not any(created):
        return parts
    out = []
    for i, p in enumerate(parts):
        gone = p["type"] == "a2ui" and _surface_of(p["message"], "deleteSurface")
        later = [_surface_of(q["message"], "createSurface") for q in parts[i + 1:] if q["type"] == "a2ui"]
        if gone and gone not in later:
            continue
        out.append(p)
    return out


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
    return {run_id: keep_earlier_surfaces(parts) for run_id, parts in out.items()}


def load_state(session_id: str, processor: A2uiRequestProcessor) -> RendererState:
    """The session's renderer state, rebuilt from every A2UI message it has shown."""
    state = processor.create_state()
    messages = [
        raise_message(upgrade_message(p["message"])) for parts in parts_by_run(session_id).values() for p in parts if p["type"] == "a2ui"
    ]
    if messages:
        try:
            state.apply(messages)
        except Exception:  # stored messages were valid when sent; don't fail the chat if not
            logger.exception("could not rebuild A2UI state for session %s", session_id)
            return processor.create_state()
    return state
