"""
Run:
python3 learn_agno/simple_agent.py
"""


from agno.agent import Agent
from agno.models.groq import Groq
from agno.db.sqlite import SqliteDb
from agno.tools.yfinance import YFinanceTools
from agno.knowledge.knowledge import Knowledge
from agno.knowledge.embedder.openai import OpenAIEmbedder
from agno.vectordb.chroma import ChromaDb
from agno.vectordb.search import SearchType
from rich.pretty import pprint
from ingestion import get_weather
from agno.knowledge.embedder.fastembed import FastEmbedEmbedder

embedder = FastEmbedEmbedder()

import httpx
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv()

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
    session_id="Veldora1"
)

# agent.print_response("What is name of user birth place?")

import asyncio

async def run_agent(agent):
    run_response = await agent.arun("What is the weather in Kolkata today?")
    pprint(run_response.content)                # the answer text
    pprint(run_response.metrics.to_dict()) 
    tools = run_response.tools or []
    print("Tool calls:", len(tools))
    # print("tools meta", tools)
    for t in tools:
        print(t.tool_name, t.tool_args, t.result)     # run metrics

if __name__ == "__main__":
    asyncio.run(run_agent(agent))