"""User actions coming back from a surface (renderer-to-agent messages)."""

import json
from typing import Any

from a2ui.rpc import RendererToAgentMessageProcessor

from app.a2ui.catalog import CATALOG

# A turn started by a click is stored with this input, so history can show it as a click.
ACTION_PREFIX = "User action: "


class InvalidAction(ValueError):
    pass


async def read_action(message: dict[str, Any]) -> dict[str, Any]:
    """Validates a renderer `action` message against the catalog and returns its action."""
    received: dict[str, Any] = {}

    def on_action(msg) -> None:
        # msg is the whole envelope ({"version", "action"}); keep the action.
        received["action"] = msg.model_dump(by_alias=True, exclude_unset=True).get("action")

    rpc = RendererToAgentMessageProcessor([CATALOG], on_action=on_action)
    try:
        await rpc.process_message(message)
    except Exception as e:
        raise InvalidAction(str(e)) from e
    if not received.get("action"):
        raise InvalidAction("Not an action message.")
    return received["action"]


# A Suggestions tap: the user "says" a reply, so the model reads it as their message.
SAY = "say"


def action_prompt(action: dict[str, Any], surface_ids: list[str]) -> str:
    """The model's input for a click: the action, and which surfaces it may update."""
    text = ACTION_PREFIX + json.dumps(action)
    context = action.get("context") or {}
    if action.get("name") == SAY and isinstance(context.get("text"), str):
        text += f"\nThe user tapped the reply {json.dumps(context['text'])}: treat it as their message."
    if surface_ids:
        text += "\nSurfaces that exist now: " + ", ".join(surface_ids)
    return text


def parse_action_prompt(text: str) -> dict[str, Any] | None:
    """The action a stored turn input carries, or None for a typed message."""
    if not text.startswith(ACTION_PREFIX):
        return None
    try:
        return json.loads(text[len(ACTION_PREFIX):].split("\n", 1)[0])
    except ValueError:
        return None
