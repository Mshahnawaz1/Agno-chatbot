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
            # Reclaim exposes 32 tools (~15k tokens of schemas), more than Groq's
            # 8k tokens/min free tier allows. Keep a core set (~3k tokens).
            include_tools=[
                "get_schedule",
                "find_open_time",
                "focus_stats",
                "get_suggested_tasks",
                "get_at_risk_tasks",
                "search_reclaim_tasks",
                "create_reclaim_task",
                "update_reclaim_task",
                "start_task",
                "stop_task",
            ],
        ),
        Connector(
            id="todoist",
            name="Todoist",
            url="https://ai.todoist.net/mcp",
            scopes="data:read_write",  # read + edit tasks/projects; no delete or billing
            notes="Add, schedule and complete tasks.",
            # 49 tools (~16k tokens) upstream; keep the task essentials (~3k tokens).
            include_tools=[
                "get-overview",
                "find-projects",
                "find-tasks",
                "find-tasks-by-date",
                "add-tasks",
                "reschedule-tasks",
                "complete-tasks",
            ],
        ),
    ]
}
