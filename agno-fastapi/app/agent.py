from agno.agent import Agent
from agno.models.groq import Groq
from agno.db.sqlite import SqliteDb

import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

from app.config import settings

Path(settings.agno_db_path).parent.mkdir(parents=True, exist_ok=True)

agent_db = SqliteDb(db_file=settings.agno_db_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# One shared instance. Never put user_id/session_id here; pass them per call.
agent = Agent(
    model=Groq(id="openai/gpt-oss-120b"),
    db=agent_db,
    add_datetime_to_context=True,
    add_history_to_context=True,
    num_history_runs= 5,
    instructions="You are a helpful assistant.",
)