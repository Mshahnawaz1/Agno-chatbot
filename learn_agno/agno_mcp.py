"""
Run : 
python3 learn_agno/agno_mcp.py
"""
import sys as _sys, pathlib as _pl  # run logs -> data/logdb/logs.db (runlog.py at the repo root)
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parents[1]))
import runlog; runlog.start("learn_agno/" + _pl.Path(__file__).stem)

import asyncio
from agno.agent import Agent
from agno.models.groq import Groq
from agno.tools.mcp import MCPTools

from dotenv import load_dotenv
import os

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TODOIST_AUTH = os.getenv("TODOIST_AUTH")

TODOIST_URL = "https://ai.todoist.net/mcp"

async def main():
    async with (
        MCPTools(
            transport="streamable-http",
            url=TODOIST_URL,
            headers={"Authorization": f"Bearer {TODOIST_AUTH}"},
        ) as todoist_mcp,
        MCPTools(transport="streamable-http", url="https://docs.agno.com/mcp") as agno_mcp,
    ):
        agent = Agent(
            model=Groq(id="openai/gpt-oss-120b"),
            tools=[todoist_mcp, agno_mcp],
        )
        await agent.aprint_response(
            "Can you access my todoist project? Give answers in very short",
            stream=True,
        )
if __name__ == "__main__":
    asyncio.run(main())