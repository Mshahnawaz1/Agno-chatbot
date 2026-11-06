"""
Run:
PYTHONPATH=. python3 app/agent.py
agno-fastapi/app/agent.py
"""
from agno.agent import Agent
from agno.models.groq import Groq
from agno.db.sqlite import SqliteDb
from agno.tools.yfinance import YFinanceTools
from agno.knowledge.knowledge import Knowledge
from agno.knowledge.embedder.openai import OpenAIEmbedder
from agno.vectordb.chroma import ChromaDb
from agno.vectordb.search import SearchType
from agno.knowledge.embedder.fastembed import FastEmbedEmbedder

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

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
CHROMA_DB = "data/chromadb"

def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    r = httpx.get(f"https://wttr.in/{city}?format=3")
    return r.text

# embedder = OpenAIEmbedder(
#     id=EMBEDDING_MODEL,
#     api_key=OPENROUTER_API_KEY,
#     base_url=OPENROUTER_BASE_URL,
# )
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

agent = Agent(
    model=Groq(id="openai/gpt-oss-120b"),
    db=agent_db,
    knowledge=knowledge,
    search_knowledge=True,
    search_past_sessions=True,
    enable_agentic_memory=True,
    add_memories_to_context=True,
    add_datetime_to_context=True,
    num_history_runs= 5,
    tools = [get_weather, YFinanceTools()],
    add_history_to_context= True,
    instructions="You are a helpful assistant.",
)
# agent.print_response("What is the name of my client?")