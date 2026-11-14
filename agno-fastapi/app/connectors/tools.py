"""MCP toolkits for the connectors a user has connected.

Connections are kept open per (user, connector) and reused across runs; a new
one is opened only when the token changes (refresh) or the old one died.
"""

import logging

from agno.tools.mcp import MCPTools

from app import db
from app.connectors import auth
from app.connectors.registry import CONNECTORS, Connector

logger = logging.getLogger(__name__)

# (user_id, connector_id) -> (token the connection was opened with, toolkit)
_live: dict[tuple[str, str], tuple[str, MCPTools]] = {}


async def user_mcp_tools(user_id: str | None) -> list[MCPTools]:
    """Connected toolkits for this user. A failing connector is skipped, never fatal."""
    if not user_id:
        return []
    tools = []
    for connector_id in db.list_connected(user_id):
        c = CONNECTORS.get(connector_id)
        if c is None:
            continue  # removed from the registry
        try:
            token = await auth.access_token(user_id, c)
            mcp = await _connect(user_id, c, token) if token else None
        except Exception:
            logger.exception("connector %s unavailable", c.id)
            continue
        if mcp:
            tools.append(mcp)
    return tools


async def _connect(user_id: str, c: Connector, token: str) -> MCPTools | None:
    key = (user_id, c.id)
    if key in _live:
        live_token, mcp = _live[key]
        if live_token == token and mcp.initialized:
            return mcp
        await disconnect(user_id, c.id)

    mcp = MCPTools(
        url=c.url,
        transport="streamable-http",
        headers={"Authorization": f"Bearer {token}"},
        tool_name_prefix=c.id,  # avoids clashes, e.g. two servers both exposing "search"
        include_tools=c.include_tools,
        refresh_connection=True,  # agno reconnects if the session dropped between runs
    )
    await mcp.connect()  # logs and leaves initialized=False on failure
    if not mcp.initialized:
        return None
    _live[key] = (token, mcp)
    return mcp


async def disconnect(user_id: str, connector_id: str) -> None:
    if entry := _live.pop((user_id, connector_id), None):
        await entry[1].close()


async def close_all() -> None:
    for key in list(_live):
        await disconnect(*key)
