"""
Test the Todoist MCP connection without an LLM/Agent.
Simulates what the Agent does: connect -> list tools -> call a tool.

Run:
python3 learn_agno/test_mcp_no_agent.py
"""
import sys as _sys, pathlib as _pl  # run logs -> data/logdb/logs.db (runlog.py at the repo root)
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parents[1]))
import runlog; runlog.start("learn_agno/" + _pl.Path(__file__).stem)

import asyncio
import json
import os

from agno.tools.mcp import MCPTools
from dotenv import load_dotenv

load_dotenv()
TODOIST_AUTH = os.getenv("TODOIST_AUTH")
TODOIST_URL = "https://ai.todoist.net/mcp"


async def main():
    if not TODOIST_AUTH:
        raise RuntimeError("TODOIST_AUTH not set in .env")

    async with MCPTools(
        transport="streamable-http",
        url=TODOIST_URL,
        headers={"Authorization": f"Bearer {TODOIST_AUTH}"},
    ) as todoist_mcp:
        # 1. What the agent "sees": registered tool functions
        funcs = todoist_mcp.get_functions()
        print(f"Connected. {len(funcs)} tools registered:")
        for name, f in funcs.items():
            print(f"  - {name}: {(f.description or '').splitlines()[0][:80]}")

        # 2. Simulate the LLM picking a tool + args, and agno executing it
        tool_name = "user-info"  # read-only, no args
        args: dict = {}
        print(f"\nCalling {tool_name}({json.dumps(args)}) ...")
        result = await funcs[tool_name].entrypoint(**args)
        print("Result:\n", str(result.content)[:1500])


if __name__ == "__main__":
    asyncio.run(main())
