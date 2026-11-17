"""The chat catalog's own functions, for A2UI function RPC (v1.0).

Two kinds beyond the basic catalog's renderer-only formatters and checks:
- a renderer function the agent may call (`allowedCallers: rendererOrAgent`): `clientInfo`, the
  browser's timezone, locale and screen. The frontend implements it
  (frontend/src/features/chat/a2ui/catalog/functions.ts); the agent reaches it with the
  `call_renderer_function` tool (app/a2ui/rpc.py).
- an agent function the renderer may call: `serverTime`, answered here by the SDK's
  RendererToAgentMessageProcessor when the renderer sends `callAgentFunction`.

Functions that need a user gesture (`requiresUserActivation`, e.g. the basic catalog's openUrl) can
only be rendererOnly, so the agent can never call them.
"""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from a2ui.core import A2uiRpcError, AgentFunction
from a2ui.core.catalog.functions import FunctionApi

EMPTY_ARGS = {"type": "object", "properties": {}, "additionalProperties": False}

CLIENT_INFO = FunctionApi(
    "clientInfo",
    return_type="object",
    schema=EMPTY_ARGS,
    allowed_callers="rendererOrAgent",
    description=(
        "The user's browser: {timezone, locale, localTime (ISO 8601 with offset), "
        "screenWidth, screenHeight}. Called by the agent with the call_renderer_function tool."
    ),
)


def _server_time(args: dict) -> str:
    tz_name = args.get("timezone") or "UTC"
    try:
        tz = ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError):
        raise A2uiRpcError(f"Unknown timezone '{tz_name}'.", code="INVALID_FUNCTION_CALL") from None
    return datetime.now(timezone.utc).astimezone(tz).isoformat(timespec="seconds")


SERVER_TIME = AgentFunction(
    "serverTime",
    handler=_server_time,
    return_type="string",
    schema={
        "type": "object",
        "properties": {"timezone": {"type": "string", "description": "An IANA timezone, default UTC."}},
        "additionalProperties": False,
    },
    description="The server's current time as ISO 8601. Called by the renderer (callAgentFunction), not used in components.",
)

# What the agent may call on the renderer, by name (the call_renderer_function tool's menu).
AGENT_CALLABLE = ["clientInfo"]


def with_rpc_functions(catalog):
    """The catalog plus `clientInfo` (renderer function) and `serverTime` (agent function)."""
    return catalog.copy_with(functions=[*catalog.functions.values(), CLIENT_INFO], agent_functions=[SERVER_TIME])
