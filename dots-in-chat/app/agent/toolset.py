"""Tools the agent gets on every run: built-in, workspace files, connected apps."""
from agno.tools.file import FileTools
from agno.tools.yfinance import YFinanceTools

from app.config import settings
from app.connectors.tools import user_connector_tools
from app.agent.tools import get_weather, primes_below

settings.agent_workspace.mkdir(parents=True, exist_ok=True)

file_tools = FileTools(
    base_dir=settings.agent_workspace,
    enable_save_file=True,
    enable_read_file=True,
    enable_list_files=True,
    enable_replace_file_chunk=True,
    enable_delete_file=True,
    enable_search_files=False,
    enable_read_file_chunk=False,
    enable_search_content=False,
)

BASE_TOOLS = [primes_below, get_weather, YFinanceTools(), file_tools]


async def agent_tools(run_context) -> list:
    """Resolved by agno on every run: shared tools + this user's connector tools
    (search/get/call meta tools, plus any attached directly; see app/connectors/tools.py)."""
    return BASE_TOOLS + await user_connector_tools(run_context)
