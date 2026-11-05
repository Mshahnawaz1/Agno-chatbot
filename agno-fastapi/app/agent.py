from agno.agent import Agent
from agno.models.groq import Groq
from agno.db.sqlite import SqliteDb
from agno.tools.yfinance import YFinanceTools

import httpx
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from app.config import settings

Path(settings.agno_db_path).parent.mkdir(parents=True, exist_ok=True)

agent_db = SqliteDb(db_file=settings.agno_db_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL")





def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    r = httpx.get(f"https://wttr.in/{city}?format=3")
    return r.text

# One shared instance. Never put user_id/session_id here; pass them per call.
agent = Agent(
    model=Groq(id="openai/gpt-oss-120b"),
    db=agent_db,
    search_past_sessions=True,
    enable_agentic_memory=True,
    add_memories_to_context=True,
    add_datetime_to_context=True,
    num_history_runs= 5,
    tools = [get_weather, YFinanceTools()],
    add_history_to_context= True,
    instructions="You are a helpful assistant.",
)