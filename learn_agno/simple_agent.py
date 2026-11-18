"""
Run:
python3 learn_agno/simple_agent.py
"""
import sys as _sys, pathlib as _pl  # run logs -> data/logdb/logs.db (runlog.py at the repo root)
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parents[1]))
import runlog; runlog.start("learn_agno/" + _pl.Path(__file__).stem)


from agno.agent import Agent
from agno.models.groq import Groq
from agno.db.sqlite import SqliteDb
from agno.tools.yfinance import YFinanceTools
from agno.knowledge.knowledge import Knowledge
from agno.knowledge.embedder.openai import OpenAIEmbedder
from agno.vectordb.chroma import ChromaDb
from agno.vectordb.search import SearchType
from rich.pretty import pprint
from agno.knowledge.embedder.fastembed import FastEmbedEmbedder
from agno.run import RunStatus

embedder = FastEmbedEmbedder()

import httpx
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from ingestion import get_weather
from utils import validate_input, validate_output

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
CHROMA_DB = "learn_agno/chromadb"

agent_db = SqliteDb(db_file="data/agno.db")

# embedder = OpenAIEmbedder(
#     id=EMBEDDING_MODEL,
#     api_key=OPENROUTER_API_KEY,
#     base_url=OPENROUTER_BASE_URL,
# )

# 2. Vector DB: Persistent ChromaDB instance
vector_db = ChromaDb(
    collection="groq_knowledge_vectors",
    path=CHROMA_DB,
    persistent_client=True,
    embedder=embedder,
    search_type=SearchType.hybrid,
    hybrid_rrf_k=60,  # default

)

# 3. Knowledge Base: Load and index your content
knowledge = Knowledge(
    name="System Docs Knowledge Base",
    vector_db=vector_db,            
)

# One shared instance. Never put user_id/session_id here; pass them per call.
agent = Agent(
    model=Groq(id="openai/gpt-oss-120b"),
    db=agent_db,
    knowledge=knowledge,
    search_knowledge=True,
    tools = [get_weather],
    add_datetime_to_context=True,
    num_history_runs= 5,
    add_history_to_context= True,
    instructions="You are a helpful assistant.",
    session_id="Veldora1",
    pre_hooks=[validate_input],
    post_hooks=[validate_output]
)

# agent.print_response("What is name of user birth place?")

import asyncio
input_text = """
Welcome to Agno
Copy page

The self-managing agent platform.

Agno is a self-managing agent platform. Build agents for your company, product, or customers. Run them as durable services on AgentOS. Put them to work automating company operations.

Build agents with the Agno, Claude Agent, or Codex SDKs. Combine agents into teams and workflows.
Run agents as durable services with built-in API and MCP. AgentOS handles authentication, role-based access, resume/replay, human approvals, scheduling, and durable execution.
Automate company operations with Company OS. Organize work into projects, tasks, and recurring routines. People set direction and review results; agents execute.
Agno provides the orchestration and service layer around your agents, making them available in:

Your product: using the REST API.
Claude and ChatGPT: using the MCP server.
Chat apps like Slack: using Agno Interfaces.
Run your platform in your own cloud and keep your data in your control. Review conversations, inspect traces, manage knowledge, and track your agent activity using the AgentOS UI.

Get started

Select your cloud provider and give this prompt to your coding agent:

Render
Railway
Docker
AWS
Fly
GCP
Kubernetes
Azure
Modal


Help me set up my agent platform and build my first agent.
Clone https://github.com/agno-agi/agentos-render into a folder called agent-platform, cd in, and run the setup-platform skill (in .agents/skills/).
The setup skill runs your platform locally and helps you build your first agent. You get:

A durable runtime (AgentOS) with an API and MCP server.
PostgreSQL for storing conversations, memory, and platform activity.
OS Manager to help build and manage your
"""

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_agent(agent, user_input: str):
    try:
        response = await agent.arun(user_input)
        if response.status == RunStatus.completed:
            print(response.content)
        else:
            logger.error("Agent execution status: %s", response.status)

        # Metrics
        if response.metrics:
            print(response.metrics.to_dict())
        return response

    except Exception as e:
        logger.exception(
            "Agent execution or hook validation failed: %s",
            e
        )
        return None


if __name__ == "__main__":
    asyncio.run(run_agent(agent, "Hello"))
