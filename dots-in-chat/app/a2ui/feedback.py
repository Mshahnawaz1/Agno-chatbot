"""What the renderer tells the agent besides clicks (A2UI v1.0 renderer-to-agent).

- `error` messages (`read_errors`);
- the data model of surfaces that set `sendDataModel` (`read_data_model`).

The browser validates every message it applies. When one fails (VALIDATION_FAILED,
UNALLOWED_PARENT, EXPRESSION_ERROR, ...) it sends an `error` message back. Here the server
validates those with the SDK's own RendererToAgentMessageProcessor and turns them into a hidden
repair turn: the model sees what the renderer rejected and sends a corrected block.
"""

import json
from typing import Any

from a2ui.core import A2uiCatalogError, A2uiValidationError
from a2ui.core.schema.v1_0 import A2uiRendererCapabilities, A2uiRendererDataModel
from a2ui.rpc import RendererToAgentMessageProcessor
from a2ui.utils import RendererState
from pydantic import ValidationError

from app.a2ui.catalog import CATALOG, GENERATOR

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


def negotiate(raw: dict[str, Any]) -> dict[str, Any]:
    """Checks an `a2uiRendererCapabilities` against the agent's catalogs and returns it.

    Raises InvalidError if it is malformed, or if the renderer supports none of the catalogs the
    agent can write for (the SDK's catalog negotiation decides).
    """
    try:
        A2uiRendererCapabilities.model_validate(raw)
        GENERATOR.create_processor(raw)
    except (A2uiCatalogError, A2uiValidationError, ValidationError) as e:
        text = e.errors()[0]["msg"] if isinstance(e, ValidationError) else str(e)
        raise InvalidError(f"Unusable a2uiRendererCapabilities: {text}") from e
    return raw


DATA_MODEL_MAX = 64_000  # chars of JSON: a form's values, not a document


def read_data_model(raw: dict[str, Any], state: RendererState) -> dict[str, Any]:
    """Validates an `a2uiRendererDataModel` and returns {surface id: data model}.

    Only surfaces that exist in this chat and opted in (`sendDataModel`) are kept: the client
    can't make the model read data of a surface the agent never asked about.
    """
    try:
        model = A2uiRendererDataModel.model_validate(raw)
    except ValidationError as e:
        raise InvalidError(f"Malformed a2uiRendererDataModel: {e.errors()[0]['msg']}") from e
    if len(json.dumps(model.surfaces)) > DATA_MODEL_MAX:
        raise InvalidError(f"a2uiRendererDataModel is larger than {DATA_MODEL_MAX} characters.")
    out: dict[str, Any] = {}
    for surface_id, data in model.surfaces.items():
        surface = state.get_surface(surface_id)
        if surface is not None and surface.send_data_model:
            out[surface_id] = data
    return out


def data_model_context(surfaces: dict[str, Any]) -> dict[str, Any] | None:
    """The model's extra context for one turn (agno `dependencies`), or None when empty."""
    if not surfaces:
        return None
    return {
        "a2ui_surface_data_models": {
            "note": "Current values on the user's screen for surfaces you created with sendDataModel=true "
            "(keyed by surface id). They are newer than anything you wrote earlier.",
            "surfaces": surfaces,
        }
    }


def parse_error_prompt(text: str) -> bool:
    """Whether a stored turn input is a renderer-error turn (history hides these)."""
    return text.startswith(ERROR_PREFIX)
