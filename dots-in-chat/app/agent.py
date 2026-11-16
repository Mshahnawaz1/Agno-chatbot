"""
Run:
PYTHONPATH=. python3 app/agent.py
dots-in-chat/app/agent.py
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
from app.a2ui import A2UI_INSTRUCTIONS, A2UI_RULE

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
    # The default 10 chunks came to ~10k chars (~2.5k tokens) per search, resent on
    # every later model call of the run; 5 hybrid-ranked chunks cover these docs.
    max_results=5,
)


def warm_embedder() -> None:
    """Load the FastEmbed model now (blocking; run it in a thread at startup).

    It loads lazily on the first knowledge search otherwise, after asking the
    Hugging Face Hub for its files: 1-12s added to the first document question.
    """
    embedder.get_embedding("warm up")

BASE_TOOLS = [primes_below, get_weather, YFinanceTools()]


def gemini_models() -> list:
    """Gemini models from settings, in order. Empty if no key or no SDK."""
    api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("No GEMINI_API_KEY: only Groq is available")
        return []
    try:
        from agno.models.google import Gemini  # needs the google-genai package
    except ImportError:
        logger.warning("google-genai not installed: only Groq is available")
        return []
    return [
        Gemini(id=model_id.strip(), api_key=api_key, timeout=settings.gemini_timeout)
        for model_id in settings.gemini_models.split(",") if model_id.strip()
    ]


def model_chain():
    """(primary model, FallbackConfig) per settings.primary_model.

    Gemini is the default: on the free tiers it took 6 x 12k-token requests in a
    row without a 429, while Groq's gpt-oss-120b allows 8k tokens/minute in total
    (x-ratelimit-limit-tokens), so a single tool-heavy turn could exhaust it.
    """
    # No SDK retries: on a 429 the Groq SDK would sleep for `retry-after` (up to 60s,
    # twice) before agno ever tried a fallback. Fail fast and fall over instead.
    groq = Groq(id=settings.groq_model, max_retries=0, timeout=settings.groq_timeout)
    gemini = gemini_models()

    if settings.primary_model == "gemini" and gemini:
        primary, fallbacks = gemini[0], gemini[1:] + [groq]
    else:
        primary, fallbacks = groq, gemini
    if not fallbacks:
        return primary, None

    def on_fallback(primary: str, fallback: str, error: Exception) -> None:
        logger.warning("model fallback %s -> %s: %s", primary, fallback, str(error)[:200])

    return primary, FallbackConfig(
        on_rate_limit=fallbacks,
        on_context_overflow=fallbacks,  # e.g. Groq 413 "request too large for your TPM"
        on_error=fallbacks,  # 5xx / network; agno never masks 401/403 config errors
        callback=on_fallback,
    )


primary_model, fallbacks = model_chain()
logger.info(f"model: {primary_model.id}, fallbacks: {[m.id for m in fallbacks.on_error] if fallbacks else []}")


async def agent_tools(run_context) -> list:
    """Resolved by agno on every run: shared tools + this user's connector tools
    (search/get/call meta tools, plus any attached directly; see app/connectors/tools.py)."""
    return BASE_TOOLS + await user_connector_tools(run_context)


agent = Agent(
    model=primary_model,
    fallback_config=fallbacks,
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
    num_history_runs= 3,
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
        A2UI_RULE,
    ],
    additional_context=A2UI_INSTRUCTIONS,  # interactive UI in replies (app/a2ui.py)
)
# agent.print_response("What is the name of my client?")