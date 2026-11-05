
"""
Run:
python3 learn_agno/ingestion.py
"""


from agno.db.sqlite import SqliteDb
from agno.knowledge.knowledge import Knowledge
from agno.knowledge.embedder.openai import OpenAIEmbedder
from agno.knowledge.reader.pdf_reader import PDFReader
from agno.vectordb.chroma import ChromaDb
from agno.vectordb.search import SearchType
from rich.pretty import pprint
from agno.knowledge.embedder.fastembed import FastEmbedEmbedder

embedder = FastEmbedEmbedder()


import httpx
import os
from dotenv import load_dotenv
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL")
EMBEDDING_MODEL = "liquid/lfm-2.5-embedding-350m:free"

PDF1 = "learn_agno/data/mp.pdf"
CHROMA_DB = "learn_agno/data/chroma"

# 1. Embedder: Free embedding model on OpenRouter via OpenAI-compatible endpoint
# embedder = OpenAIEmbedder(
#     id=EMBEDDING_MODEL,
#     api_key=os.getenv("OPENROUTER_API_KEY"),
#     base_url="https://openrouter.ai/api/v1",
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

# Insert documents or raw text
knowledge.insert(
    text_content="""
The name of my client is Gobta pvt. ltd.
    """,
    skip_if_exists=True
)

pdf_reader = PDFReader(
    chunk=True,             # Enable automatic chunking, can be changed to recursive or other.
    chunk_size=3000,        # Number of characters per chunk
    split_on_pages=True,    # Preserve page-level document boundaries
    # password="secret",    # Optional: for encrypted PDFs
)

knowledge.insert(
    path=PDF1,
    reader=pdf_reader,
    skip_if_exists=True
)


# Check how many chunks exist in your collection
print("Total vectors stored:", vector_db.client.get_collection("groq_knowledge_vectors").count())
results = knowledge.search(query="Types of noise")
for doc in results:
    print("Found chunk:", doc.content[:150])

def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    r = httpx.get(f"https://wttr.in/{city}?format=3")
    return r.text