"""What tools each connector offers, and searching them, without contacting the server.

A connector's tool list (MCP tools/list) is stored in the DB the first time we
connect and refreshed whenever a connection is opened anyway, or after CATALOG_TTL.
Runs read it from memory, so knowing which tools exist costs no network call;
the server is contacted only when a tool is actually called.
"""

import json
import math
import re
import time
from collections import Counter
from dataclasses import asdict, dataclass

from app import db
from app.connectors.registry import CONNECTORS, Connector

CATALOG_TTL = 24 * 3600  # seconds


@dataclass(frozen=True)
class ToolSpec:
    name: str  # as the model sees it: "<connector id>_<server tool name>"
    server_name: str  # as the MCP server knows it
    connector: str
    description: str
    schema: dict  # JSON schema of the arguments
    read_only: bool  # MCP readOnlyHint: safe to cache, doesn't change anything

    @property
    def prose(self) -> str:
        """The description without markdown headings (some servers send '# TOOL' docs)."""
        lines = [ln.strip() for ln in (self.description or "").splitlines()]
        return " ".join(ln for ln in lines if ln and not ln.startswith("#"))

    @property
    def summary(self) -> str:
        """First sentence of the description, for compact listings."""
        first = re.split(r"(?<=[.!?])\s", self.prose, maxsplit=1)[0]
        return first[:160]


_memory: dict[str, tuple[float, list[ToolSpec]]] = {}  # connector id -> (fetched_at, tools)


def _field(obj, name: str, old_name: str):
    """mcp renamed camelCase fields to snake_case; read whichever this version has."""
    if name in getattr(type(obj), "model_fields", {}):
        return getattr(obj, name)
    return getattr(obj, old_name, None)


def store(c: Connector, mcp_tools: list) -> list[ToolSpec]:
    """Save the raw tools/list result (mcp.types.Tool objects) as the connector's catalog."""
    specs = []
    for t in mcp_tools:
        annotations = getattr(t, "annotations", None)
        read_only = bool(_field(annotations, "read_only_hint", "readOnlyHint")) if annotations else False
        specs.append(
            ToolSpec(
                name=f"{c.id}_{t.name}",
                server_name=t.name,
                connector=c.id,
                description=t.description or "",
                schema=_field(t, "input_schema", "inputSchema") or {"type": "object", "properties": {}},
                read_only=read_only,
            )
        )
    now = time.time()
    _memory[c.id] = (now, specs)
    db.save_catalog(c.id, json.dumps([asdict(s) for s in specs]), now)
    _index_cache.clear()
    return specs


def cached(c: Connector) -> tuple[list[ToolSpec], bool] | None:
    """(the connector's tools after include_tools, still fresh?), or None if never fetched."""
    entry = _memory.get(c.id)
    if entry is None:
        row = db.get_catalog(c.id)
        if row is None:
            return None
        entry = (row[1], [ToolSpec(**d) for d in json.loads(row[0])])
        _memory[c.id] = entry
    fetched_at, specs = entry
    if c.include_tools is not None:  # the registry is the allowlist, applied on read
        allowed = set(c.include_tools)
        specs = [s for s in specs if s.server_name in allowed]
    return specs, time.time() - fetched_at < CATALOG_TTL


# ---- search ----
# BM25 over each tool's name + description. Tiny corpus (tens of tools), so it is
# rebuilt per connector set and memoised.

_WORD = re.compile(r"[a-z0-9]+")
_STOP = {
    "a", "an", "the", "to", "of", "for", "in", "on", "at", "and", "or", "is", "are", "my",
    "me", "i", "you", "your", "it", "this", "that", "with", "by", "be", "can", "please",
    "what", "do", "does", "use", "using", "from", "all", "any", "one", "more", "new",
    "how", "have", "has", "get", "s", "tool", "user", "will", "when", "if", "not", "as",
}
# Everyday words -> the words tool names/descriptions use. Applied to queries only.
_SYNONYMS = {
    "done": "complete", "finish": "complete", "finished": "complete", "tick": "complete",
    "move": "reschedule", "postpone": "reschedule", "push": "reschedule", "delay": "reschedule",
    "due": "date", "today": "date", "tomorrow": "date", "week": "date", "overdue": "date", "plate": "date",
    "create": "add", "remind": "add", "reminder": "add", "todo": "task",
    "calendar": "schedule", "agenda": "schedule", "meeting": "schedule", "event": "schedule",
    "free": "open", "available": "open", "slot": "open", "block": "schedule",
    "show": "find", "list": "find", "search": "find", "look": "find",
}
DESCRIPTION_WORDS = 40  # index only the start: long docs otherwise match everything


def tokens(text: str, expand: bool = False) -> list[str]:
    out = []
    for w in _WORD.findall(text.lower()):
        if expand and w in _SYNONYMS:
            out.append(_stem(w))
            w = _SYNONYMS[w]
        if w in _STOP:
            continue
        out.append(_stem(w))
    return out


def _stem(w: str) -> str:
    """Light stemming so "tasks"/"task", "scheduled"/"schedule" meet."""
    for suffix in ("ing", "ed", "es", "s"):
        if len(w) > len(suffix) + 2 and w.endswith(suffix):
            return w[: -len(suffix)]
    return w


class _Index:
    def __init__(self, specs: list[ToolSpec]):
        self.specs = specs
        # Name words count triple ("add-tasks" says more than a paragraph); the
        # connector id is dropped from the name since every tool of it shares it.
        self.docs = [
            Counter(
                tokens(s.server_name.replace("_", " ").replace("-", " ")) * 3
                + tokens(s.prose)[:DESCRIPTION_WORDS]
            )
            for s in specs
        ]
        self.avg_len = sum(sum(d.values()) for d in self.docs) / max(len(self.docs), 1)
        df = Counter(w for d in self.docs for w in d)
        n = len(self.docs)
        self.idf = {w: math.log(1 + (n - f + 0.5) / (f + 0.5)) for w, f in df.items()}

    def search(self, query: str) -> list[tuple[float, ToolSpec]]:
        q = set(tokens(query, expand=True))
        k1, b = 1.2, 0.75
        scored = []
        for spec, doc in zip(self.specs, self.docs):
            length = sum(doc.values())
            score = 0.0
            for w in q:
                f = doc.get(w)
                if f:
                    score += self.idf[w] * f * (k1 + 1) / (f + k1 * (1 - b + b * length / self.avg_len))
            if score > 0:
                scored.append((score, spec))
        scored.sort(key=lambda x: -x[0])
        return scored


_index_cache: dict[tuple[str, ...], _Index] = {}


def search(specs: list[ToolSpec], query: str) -> list[tuple[float, ToolSpec]]:
    key = tuple(s.name for s in specs)
    index = _index_cache.get(key)
    if index is None:
        index = _index_cache[key] = _Index(specs)
    return index.search(query)


def mentioned_connectors(query: str, connector_ids: list[str]) -> list[str]:
    """Connectors the user named outright ("in todoist", "my Reclaim schedule")."""
    words = set(_WORD.findall(query.lower()))
    hits = []
    for cid in connector_ids:
        c = CONNECTORS[cid]
        names = {cid, *_WORD.findall(c.name.lower())} - {"ai"}  # "Reclaim.ai" -> reclaim
        if words & names:
            hits.append(cid)
    return hits
