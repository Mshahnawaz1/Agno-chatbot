
"""
Run:
python3 app/ingestion.py
"""
from agno.knowledge.knowledge import Knowledge
from agno.knowledge.embedder.openai import OpenAIEmbedder
from agno.knowledge.reader.pdf_reader import PDFReader
from agno.vectordb.chroma import ChromaDb
from agno.vectordb.search import SearchType
from agno.knowledge.embedder.fastembed import FastEmbedEmbedder

embedder = FastEmbedEmbedder()

import httpx
import os
from dotenv import load_dotenv
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
CHROMA_DB = "data/chromadb"
PDF1 = "data/jd.pdf"
PDF2 = "data/mp.pdf"

# embedder = OpenAIEmbedder(
#     id=EMBEDDING_MODEL, #model name can be str, working
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

# Insert documents or raw text
knowledge.insert(
    text_content="""
    The name of the client is Gobutaki pvt ltd. And he has been a good client.
    """,
    skip_if_exists=True
)
knowledge.insert(
    text_content="""
    I live in Bengaluru, india. And is working as software developer.
"""
)

pdf_reader = PDFReader(
    chunk=True,             # Enable automatic chunking, can be changed to recursive or other.
    chunk_size=1000,        # Number of characters per chunk
    split_on_pages=True,    # Preserve page-level document boundaries
    # password="secret",    # Optional: for encrypted PDFs
)

knowledge.insert(
    path=PDF1,
    reader=pdf_reader,
    skip_if_exists=True
)
# Major project
knowledge.insert(
    path=PDF2,
    reader=pdf_reader,
    skip_if_exists=True
)

def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    r = httpx.get(f"https://wttr.in/{city}?format=3")
    return r.text