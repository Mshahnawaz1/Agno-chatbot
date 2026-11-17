
"""
Run:
python3 learn_agno/ingestion.py
"""


"""Run: python3 learn_agno/ingestion.py"""
import logging
from pathlib import Path

from agno.knowledge.embedder.fastembed import FastEmbedEmbedder
from agno.knowledge.knowledge import Knowledge
from agno.knowledge.reader.pdf_reader import PDFReader
from agno.vectordb.chroma import ChromaDb
from agno.vectordb.search import SearchType
import httpx

BASE = Path(__file__).parent
PDF_PATH = BASE / "data" / "mp.pdf"
CHROMA_PATH = BASE / "data" / "chroma"
COLLECTION = "system_docs_vectors"

log = logging.getLogger(__name__)


def build_knowledge() -> Knowledge:
    """Construct the knowledge base (reusable by your agent, no ingestion)."""
    vector_db = ChromaDb(
        collection=COLLECTION,
        path=str(CHROMA_PATH),
        persistent_client=True,
        embedder=FastEmbedEmbedder(),
        search_type=SearchType.hybrid,
        hybrid_rrf_k=60,
    )
    return Knowledge(name="System Docs Knowledge Base", vector_db=vector_db)


def ingest(knowledge: Knowledge) -> None:
    if not PDF_PATH.exists():
        raise FileNotFoundError(PDF_PATH)

    reader = PDFReader(chunk=True, chunk_size=1200, split_on_pages=True)
    knowledge.insert(path=str(PDF_PATH), reader=reader, skip_if_exists=True)


def verify(knowledge: Knowledge, query: str = "Types of noise") -> None:
    results = knowledge.search(query=query)
    log.info("Query %r returned %d chunks", query, len(results))
    for doc in results[:3]:
        log.info("  %s", doc.content[:150])

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    kb = build_knowledge()
    ingest(kb)
    verify(kb)
