"""Available connectors. To add one, append a Connector below; nothing else changes.

Auth is discovered from the server: OAuth if it publishes OAuth metadata, otherwise
the user is asked for an API key.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Connector:
    id: str  # used in URLs, DB rows and as the tool name prefix
    name: str
    url: str  # MCP server URL (streamable HTTP)
    scopes: str = ""  # space-separated OAuth scopes; empty = server default
    notes: str = ""  # shown to the user before connecting
    include_tools: list[str] | None = None  # None = expose every tool the server offers


CONNECTORS = {
    c.id: c
    for c in [
        Connector(
            id="reclaim",
            name="Reclaim.ai",
            url="https://mcp.reclaim.ai",
            scopes="read write mcp",
            notes="Beta. Needs Reclaim 2.0 with a Google or Outlook calendar connected.",
        ),
    ]
}
