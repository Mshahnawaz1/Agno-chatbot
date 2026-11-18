"""Document knowledge base: persistent ChromaDB with FastEmbed, hybrid search."""
from agno.knowledge.embedder.fastembed import FastEmbedEmbedder
from agno.knowledge.knowledge import Knowledge
from agno.vectordb.chroma import ChromaDb
from agno.vectordb.search import SearchType

CHROMA_DB = "data/chromadb"
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
    # The default 10 chunks came to ~10k chars (~2.5k tokens) per search, resent on
    # every later model call of the run; 5 hybrid-ranked chunks cover these docs.
    max_results=5,
)


def warm_embedder() -> None:
    """Load the FastEmbed model now (blocking; run it in a thread at startup).

    It loads lazily on the first knowledge search otherwise, after asking the
    Hugging Face Hub for its files: 1-12s added to the first document question.
    """
    embedder.get_embedding("warm up")
