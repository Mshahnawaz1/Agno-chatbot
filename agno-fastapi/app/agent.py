"""
Run:
PYTHONPATH=. python3 app/agent.py
agno-fastapi/app/agent.py
"""
from agno.agent import Agent
from agno.models.fallback import FallbackConfig
from agno.models.groq import Groq
from agno.utils.log import logger
from agno.db.sqlite import SqliteDb
from agno.tools.yfinance import YFinanceTools
from agno.knowledge.knowledge import Knowledge
from agno.vectordb.chroma import ChromaDb
from agno.vectordb.search import SearchType
from agno.knowledge.embedder.fastembed import FastEmbedEmbedder

import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from app.config import settings
from app.guardrails import piiGuardrails, input_length_guardrail, tool_logger_hook, output_hook_validate
from app.tools import primes_below, get_weather
from app.connectors.tools import user_connector_tools
from app.skills import skills

Path(settings.agno_db_path).parent.mkdir(parents=True, exist_ok=True)

agent_db = SqliteDb(db_file=settings.agno_db_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL")

CHROMA_DB = "data/chromadb"
embedder = FastEmbedEmbedder()


# 2. Vector DB: Persistent ChromaDB instance
vector_db = ChromaDb(
    collection="groq_knowledge_vectors",
    path=CHROMA_DB,
    persistent_client=True,
    embedder=embedder,
    search_type=SearchType.hybrid,
    hybrid_rrf_k=60,  # default

)
knowledge = Knowledge(
    name="System Docs Knowledge Base",
    vector_db=vector_db,
)

BASE_TOOLS = [primes_below, get_weather, YFinanceTools()]


def fallback_config() -> FallbackConfig | None:
    """Gemini, used when Groq rate-limits or errors. None if no key or no SDK."""
    api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("No GEMINI_API_KEY: Groq errors and rate limits will fail the run")
        return None
    try:
        from agno.models.google import Gemini  # needs the google-genai package
    except ImportError:
        logger.warning("google-genai not installed: no Gemini fallback")
        return None
    gemini = [
        Gemini(id=model_id.strip(), api_key=api_key, timeout=settings.gemini_timeout)
        for model_id in settings.gemini_models.split(",") if model_id.strip()
    ]

    def on_fallback(primary: str, fallback: str, error: Exception) -> None:
        logger.warning("model fallback %s -> %s: %s", primary, fallback, str(error)[:200])

    return FallbackConfig(
        on_rate_limit=gemini,
        on_context_overflow=gemini,  # Groq 413 "request too large for your TPM"
        on_error=gemini,  # 5xx / network; agno never masks 401/403 config errors
        callback=on_fallback,
    )


async def agent_tools(run_context) -> list:
    """Resolved by agno on every run: shared tools + this user's connector tools
    (search/get/call meta tools, plus any attached directly; see app/connectors/tools.py)."""
    return BASE_TOOLS + await user_connector_tools(run_context)


agent = Agent(
    model=Groq(id=settings.groq_model),
    fallback_config=fallback_config(),
    db=agent_db,
    knowledge=knowledge,
    pre_hooks=[input_length_guardrail, piiGuardrails],
    tool_hooks=[tool_logger_hook], #applied to each tool call
    # post_hooks=[output_hook_validate], # No need for streaming response
    search_knowledge=True,
    # agno's default says "search before answering questions", which costs an extra
    # model round trip on unrelated questions; scope it in `instructions` instead.
    add_search_knowledge_instructions=False,
    search_past_sessions=True,
    enable_agentic_memory=True,
    add_memories_to_context=True,
    add_datetime_to_context=True,
    num_history_runs= 5,
    # Old tool results (task lists, schedules) are the bulkiest history; keep the last few.
    max_tool_calls_from_history=3,
    tools=agent_tools,
    cache_callables=False,  # tools differ per user and change when they (dis)connect
    skills=skills,  # skills/ + connector_skills/, loaded on demand (app/skills.py)
    add_history_to_context= True,
    instructions=[
        "You are a helpful assistant.",
        "Use search_knowledge_base only for questions about the user's documents.",
        "Connected-app tools are named <app>_<tool>, e.g. todoist_find-tasks. If one in "
        "your tool list fits, call it directly. Only when none fits: search_tools, "
        "then get_tool, then call_tool.",
    ],
)
# agent.print_response("What is the name of my client?")