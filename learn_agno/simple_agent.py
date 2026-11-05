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
)

agent.print_response("What is name of user birth place?")


# run_response = agent.run("What is the skill requirement for the company?")
# # Session metrics
# for message in run_response.messages:
#     if message.role == "assistant":
#         pprint(message.metrics.to_dict())
# # Run metrics (RunMetrics)
# pprint(run_response.metrics.to_dict())
# # Per-model breakdown
# if run_response.metrics.details:
#     for model_type, model_metrics_list in run_response.metrics.details.items():
#         for m in model_metrics_list:
#             print(f"{model_type}: {m.provider}/{m.id} - {m.total_tokens} tokens")
# # Session metrics (SessionMetrics)
# pprint(agent.get_session_metrics().to_dict())