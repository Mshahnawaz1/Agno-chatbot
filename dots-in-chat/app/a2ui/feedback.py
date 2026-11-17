"""What the renderer tells the agent besides clicks: `error` messages (A2UI v1.0 renderer-to-agent).

The browser validates every message it applies. When one fails (VALIDATION_FAILED,
UNALLOWED_PARENT, EXPRESSION_ERROR, ...) it sends an `error` message back. Here the server
validates those with the SDK's own RendererToAgentMessageProcessor and turns them into a hidden
repair turn: the model sees what the renderer rejected and sends a corrected block.
"""

import json
from typing import Any

from a2ui.rpc import RendererToAgentMessageProcessor

from app.a2ui.catalog import CATALOG

# A turn started by renderer errors is stored with this input; history hides it.
ERROR_PREFIX = "Renderer error: "
MAX_ERRORS = 5  # per request: more than that is one bug repeated
ERROR_TEXT_MAX = 600


class InvalidError(ValueError):
    pass


async def read_errors(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Validates renderer `error` messages and returns their error bodies."""
    if not messages or len(messages) > MAX_ERRORS:
        raise InvalidError(f"Send 1 to {MAX_ERRORS} error messages.")
    errors: list[dict[str, Any]] = []

    def on_error(msg) -> None:
        body = msg.model_dump(by_alias=True, exclude_unset=True).get("error") or {}
        errors.append({k: (v[:ERROR_TEXT_MAX] if isinstance(v, str) else v) for k, v in body.items()})

    rpc = RendererToAgentMessageProcessor([CATALOG], on_error=on_error)
    for message in messages:
        try:
            result = await rpc.process_message(message)
        except Exception as e:
            raise InvalidError(str(e)) from e
        if not result.handled:
            raise InvalidError("Not an error message.")
    return errors


def error_prompt(errors: list[dict[str, Any]], surface_ids: list[str]) -> str:
    """The model's input for renderer errors: what the browser rejected, and what to do."""
    lines = "\n".join(f"- {json.dumps(e)}" for e in errors)
    return (
        f"{ERROR_PREFIX}the user's browser rejected part of the UI you sent, so it is not "
        f"(fully) shown:\n{lines}\n"
        f"Surfaces that exist now: {', '.join(surface_ids) or 'none'}.\n"
        "Send only a corrected <a2ui> block for the surface named in `surfaceId` (update it with "
        '`surface("<id>", update=true)` if it exists, else create it). If the error has no '
        "surface or you cannot fix it, say so in one sentence. Don't apologise."
    )


def parse_error_prompt(text: str) -> bool:
    """Whether a stored turn input is a renderer-error turn (history hides these)."""
    return text.startswith(ERROR_PREFIX)
