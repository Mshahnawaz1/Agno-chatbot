"""Function RPC between the agent and the renderer (A2UI v1.0), both directions.

Agent to renderer (`call_renderer_function` tool): the tool builds a `callRendererFunction` with
the SDK's RendererFunctionCalls, which checks the catalog (the function must be a renderer
function with allowedCallers agentOnly or rendererOrAgent and no requiresUserActivation). The
message goes out on the open chat stream (an `a2ui_rpc` event); the browser runs it and POSTs the
`rendererFunctionResponse` to /chat/rpc, which settles the call, and the tool returns the value
to the model. Calls the model wrote itself (standalone calls in an <a2ui> block) are not pending
here: their responses are handed back as a turn (see `is_pending`).

Renderer to agent: `callAgentFunction` arrives at /chat/rpc and is answered by the SDK's
RendererToAgentMessageProcessor from the catalog's agent functions (functions.py), which enforces
the function's schema and allowedCallers and always replies with one `agentFunctionResponse`.

State is per chat and in memory (one process). Pending calls die with the stream that made them.
"""

import asyncio
import json
import logging
from typing import Any

from a2ui.core import A2uiRpcError
from a2ui.rpc import RendererFunctionCalls, RendererFunctionResponseMessage, RendererToAgentMessageProcessor
from agno.run import RunContext
from agno.tools import tool
from pydantic import ValidationError

from app.a2ui.catalog import CATALOG, CATALOG_ID
from app.a2ui.feedback import InvalidError

logger = logging.getLogger(__name__)

CALL_TIMEOUT = 15.0  # seconds the model waits for the browser
AGENT_FUNCTION_TIMEOUT = 10.0
RESULT_MAX = 4000  # chars of a function result handed to the model

# Prefix of a stored turn input that carries a function result the model didn't wait for.
RESULT_PREFIX = "Renderer function result: "


class _Chat:
    def __init__(self) -> None:
        self.calls = RendererFunctionCalls(default_timeout=CALL_TIMEOUT, max_pending=4, catalogs=[CATALOG])
        self.outbox: asyncio.Queue | None = None  # the open stream's queue of (event, data)


_chats: dict[str, _Chat] = {}


def _chat(session_id: str) -> _Chat:
    return _chats.setdefault(session_id, _Chat())


def open_stream(session_id: str, outbox: asyncio.Queue) -> None:
    _chat(session_id).outbox = outbox


def close_stream(session_id: str) -> None:
    """The stream ended: calls still waiting can't be answered any more."""
    chat = _chats.pop(session_id, None)
    if chat:
        chat.calls.dispose("The chat stream ended.")


async def call_renderer(session_id: str, name: str, args: dict[str, Any] | None = None, surface_id: str | None = None) -> Any:
    """Calls a renderer function and returns its value. Raises A2uiRpcError."""
    chat = _chat(session_id)
    if chat.outbox is None:
        raise A2uiRpcError("No browser is connected to this chat.", code="NO_RENDERER")
    message, result = chat.calls.call(catalog_id=CATALOG_ID, name=name, args=args, surface_id=surface_id)
    chat.outbox.put_nowait(("a2ui_rpc", {"message": message.model_dump(by_alias=True, exclude_unset=True)}))
    return await result


async def handle(session_id: str, message: dict[str, Any]) -> dict[str, Any]:
    """Processes one renderer-to-agent RPC message.

    Returns {"handled": bool, "replies": [...]}: replies are for the renderer; a message that is
    not handled (a response to a call that is not pending) is for the model's turn.
    """
    chat = _chat(session_id)
    processor = RendererToAgentMessageProcessor(
        [CATALOG],
        agent_function_timeout=AGENT_FUNCTION_TIMEOUT,
        on_renderer_function_response=chat.calls.resolve,
    )
    result = await processor.process_message(message)
    return {
        "handled": result.handled,
        "replies": [r.model_dump(by_alias=True, exclude_unset=True) for r in result.replies],
    }


def is_pending(session_id: str, function_call_id: str) -> bool:
    chat = _chats.get(session_id)
    return bool(chat and chat.calls.is_pending(function_call_id))


def read_result(message: dict[str, Any]) -> dict[str, Any]:
    """Validates a `rendererFunctionResponse` and returns it as plain JSON."""
    try:
        return RendererFunctionResponseMessage.model_validate(message).model_dump(by_alias=True, exclude_unset=True)
    except ValidationError as e:
        raise InvalidError(f"Malformed rendererFunctionResponse: {e.errors()[0]['msg']}") from e


def result_prompt(response: dict[str, Any]) -> str:
    """The model's input for a function result it didn't wait for (a standalone call it wrote)."""
    body = json.dumps(response.get("rendererFunctionResponse"))[:RESULT_MAX]
    return f"{RESULT_PREFIX}{body}\nThis answers the function call you wrote in your last reply. Use it now."




@tool
async def call_renderer_function(run_context: RunContext, function: str, args_json: str = "{}") -> str:
    """Run a function in the user's browser and get its result (the user must have the chat open).
    Use it for facts only the browser knows. Load the a2ui skill (references/rpc.md) first.

    Args:
        function: The function name, one of: clientInfo.
        args_json: The function's arguments as a JSON object string (clientInfo takes none).
    """
    try:
        args = json.loads(args_json or "{}")
        if not isinstance(args, dict):
            raise ValueError("not an object")
    except ValueError:
        return json.dumps({"error": {"code": "INVALID_FUNCTION_CALL", "message": "args_json must be a JSON object."}})
    try:  # the SDK refuses anything the catalog doesn't let an agent call
        value = await call_renderer(run_context.session_id, function, args)
    except A2uiRpcError as e:
        logger.info("renderer function %s failed: %s %s", function, e.code, e.message)
        return json.dumps({"error": {"code": str(e.code), "message": e.message}})
    return json.dumps({"value": value})[:RESULT_MAX]
