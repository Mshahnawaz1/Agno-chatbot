"""Source cards: which knowledge-base chunks a reply actually drew on.

agno keeps every knowledge search of a run in `run.references` (query + the chunks with their
`name`, `meta_data.page` / `chunk` and text), also in the run's `RunCompleted` event. This module
turns those into a short list of cards: file, page/chunk, snippet, and a workspace path so a click
opens the file in the files panel.
"""
import logging
import re
import shutil
from pathlib import Path
from typing import Any

from app.agent.formats import adapter_for
from app.agent.workspace import APP_ROOT, workspace_for

logger = logging.getLogger(__name__)

KB_SOURCE_DIR = APP_ROOT / "data"  # where ingestion.py reads the documents it indexes
SOURCES_DIR = "sources"  # in the user's workspace: copies of the knowledge files cards open
MAX_CARDS = 3
SNIPPET_CHARS = 240
MIN_SHARED_WORDS = 3  # a search that found nothing relevant must not look like evidence

_WORD = re.compile(r"[a-z0-9]{5,}")


def _words(text: str) -> set[str]:
    return set(_WORD.findall(text.lower()))


def _snippet(content: str) -> str:
    text = re.sub(r"[\s.]*\n[\s.]*", " ", content).strip()  # collapse PDF line breaks and dot leaders
    text = re.sub(r"\s+", " ", text)
    return text if len(text) <= SNIPPET_CHARS else text[:SNIPPET_CHARS].rstrip() + "…"


def workspace_copy(user_id: str, name: str) -> str | None:
    """Workspace path of knowledge file `name` (copied in if missing or changed), or None when the
    chunk has no file: inline text, a name with folders, a file that is gone or a type the panel
    cannot show. Only files directly in KB_SOURCE_DIR qualify."""
    if not name or name != Path(name).name or name.startswith("."):
        return None
    src = KB_SOURCE_DIR / name
    try:
        if not src.is_file() or src.is_symlink() or adapter_for(src) is None:
            return None
        dest = workspace_for(user_id) / SOURCES_DIR / name
        if not dest.is_file() or dest.stat().st_size != src.stat().st_size:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
        return f"{SOURCES_DIR}/{name}"
    except OSError:
        logger.warning("could not copy knowledge file %s", name, exc_info=True)
        return None


def build_sources(references: list[Any] | None, reply: str, user_id: str) -> list[dict]:
    """Cards for the chunks of `references` that the `reply` shares wording with, best first.

    Retrieval always returns the top chunks, relevant or not, so a chunk counts only when the reply
    reuses at least MIN_SHARED_WORDS of its words. Each card: {name, page, chunk, snippet, path}.
    """
    reply_words = _words(reply or "")
    if not reply_words:
        return []
    seen: dict[tuple, tuple[int, dict]] = {}
    for ref in references or []:
        docs = ref.get("references") if isinstance(ref, dict) else getattr(ref, "references", None)
        for doc in docs or []:
            if not isinstance(doc, dict):
                continue
            content = str(doc.get("content") or "")
            meta = doc.get("meta_data") or {}
            raw = str(doc.get("name") or "")
            name = raw if raw and raw == raw.strip() else "Note"  # inline text is named after its first chars
            shared = len(reply_words & _words(content))
            if shared < MIN_SHARED_WORDS:
                continue
            key = (name, meta.get("page"), meta.get("chunk"))
            card = {
                "name": name,
                "page": meta.get("page"),
                "chunk": meta.get("chunk"),
                "snippet": _snippet(content),
            }
            if key not in seen or shared > seen[key][0]:
                seen[key] = (shared, card)
    best = sorted(seen.values(), key=lambda t: -t[0])[:MAX_CARDS]
    cards = [c for _, c in best]
    for c in cards:
        c["path"] = workspace_copy(user_id, c["name"])
    return cards
