"""
Builds the chat agent: model chain + tools + knowledge + skills + system prompt.

Run:
PYTHONPATH=. python3 -m app.agent.core
"""
from dotenv import load_dotenv

load_dotenv()

from pathlib import Path

from agno.agent import Agent
from agno.db.sqlite import SqliteDb
from agno.utils.log import logger

from app.agent.knowledge import knowledge
from app.agent.models import model_chain
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.toolset import agent_tools
from app.config import settings
from app.agent.guardrails import tool_logger_hook  # other guardrails exist but are disabled
from app.skills import skills

Path(settings.agno_db_path).parent.mkdir(parents=True, exist_ok=True)

primary_model, fallbacks = model_chain()
logger.info(f"model: {primary_model.id}, fallbacks: {[m.id for m in fallbacks.on_error] if fallbacks else []}")

agent = Agent(
    model=primary_model,
    fallback_config=fallbacks,
    db=SqliteDb(db_file=settings.agno_db_path),
    instructions=SYSTEM_PROMPT,
    # Tools and skills
    tools=agent_tools,
    cache_callables=False,  # tools differ per user and change when they (dis)connect
    tool_hooks=[tool_logger_hook],  # applied to each tool call
    skills=skills,  # skills/ + connector_skills/, loaded on demand (app/skills.py)
    # Knowledge: searched via the tool; the prompt says when
    knowledge=knowledge,
    add_search_knowledge_instructions=False,
    # Memory and history
    enable_agentic_memory=True,
    add_memories_to_context=True,
    search_past_sessions=True,
    num_past_sessions_to_search=8,
    add_history_to_context=True,
    num_history_runs=3,
    # Old tool results (task lists, schedules) are the bulkiest history; keep the last few.
    max_tool_calls_from_history=3,
    add_datetime_to_context=True,
)
