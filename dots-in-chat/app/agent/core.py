"""The chat agent: wires models, knowledge, memory, tools and skills together."""
from pathlib import Path

from agno.agent import Agent
from agno.db.sqlite import SqliteDb
from agno.memory import MemoryManager
from agno.tools.file import FileTools
from agno.tools.function import Function
from agno.tools.yfinance import YFinanceTools

from app.agent.docx_tools import DocxTools
from app.agent.guardrails import tool_logger_hook
from app.agent.knowledge import knowledge
from app.agent.memory import MEMORY_INSTRUCTIONS, make_memory_tool
from app.agent.models import fallbacks, primary_model
from app.agent.skills import skills
from app.agent.tools import get_weather, primes_below
from app.agent.workspace import workspace_for
from app.config import settings
from app.connectors.tools import user_connector_tools

Path(settings.agno_db_path).parent.mkdir(parents=True, exist_ok=True)

agent_db = SqliteDb(db_file=settings.agno_db_path)
memory_manager = MemoryManager(db=agent_db, model=primary_model)

BASE_TOOLS = [
    primes_below, get_weather, YFinanceTools(),
    Function.from_callable(make_memory_tool(memory_manager), name="update_user_memory"),
]

def user_file_tools(user_id: str) -> list:
    """This user's file tools. FileTools refuses paths outside base_dir (their own workspace)."""
    base = workspace_for(user_id)
    return [
        FileTools(
            base_dir=base,
            enable_save_file=True,
            enable_replace_file_chunk=True,
            enable_delete_file=True,
            enable_list_files=True,
            enable_search_files=True,
            enable_read_file=True,
            enable_read_file_chunk=False,
            enable_search_content=False,
        ),
        DocxTools(base_dir=base),
    ]


async def agent_tools(run_context) -> list:
    """Resolved by agno on every run: shared tools + this user's connector tools
    (search/get/call meta tools, plus any attached directly; see app/connectors/tools.py)."""
    return BASE_TOOLS + await user_connector_tools(run_context) + user_file_tools(run_context.user_id)


INSTRUCTIONS = [
    "You are a helpful assistant.",
    "Use search_knowledge_base only for questions about the user's documents.",
    "Connected-app tools are named <app>_<tool>, e.g. todoist_find-tasks. If one in "
    "your tool list fits, call it directly. Only when none fits: search_tools, "
    "then get_tool, then call_tool.",
    MEMORY_INSTRUCTIONS,
    "Files: write long content (documents, reports) to a file with save_file instead of pasting "
    "it in chat, then say what you created in one line. Word documents are written as Markdown "
    "(.md); then call build_docx(source) to produce the .docx. After any edit to a .md that has "
    "a .docx twin, call build_docx again. Edit with replace_file_chunk rather than rewriting. "
    "To edit an existing .docx, call import_docx first. Delete only files you created.",
]

agent = Agent(
    model=primary_model,
    fallback_config=fallbacks,
    db=agent_db,
    knowledge=knowledge,
    # Input/output guardrails (pre_hooks/post_hooks) live in guardrails.py but are off: output
    # checks don't fit streaming.
    tool_hooks=[tool_logger_hook],  # times each tool call
    search_knowledge=True,
    # agno's default says "search before answering questions", which costs an extra
    # model round trip on unrelated questions; scope it in `instructions` instead.
    add_search_knowledge_instructions=False,
    search_past_sessions=True,
    # Its listing defaults to 20 sessions x 3 runs (8k chars on average, resent on every later
    # model call of the run); read_past_session still reads a whole session when needed.
    num_past_sessions_to_search=8,
    # Not enable_agentic_memory: its tool blocks the reply on a nested LLM loop. BASE_TOOLS has
    # a same-named tool that saves in the background (app/agent/memory.py).
    memory_manager=memory_manager,
    add_memories_to_context=True,
    add_datetime_to_context=True,
    num_history_runs=3,
    # Old tool results (task lists, schedules) are the bulkiest history; keep the last few.
    max_tool_calls_from_history=3,
    tools=agent_tools,
    cache_callables=False,  # tools differ per user and change when they (dis)connect
    skills=skills,  # skills/ + connector_skills/, loaded on demand (app/agent/skills.py)
    add_history_to_context=True,
    instructions=INSTRUCTIONS,
)
