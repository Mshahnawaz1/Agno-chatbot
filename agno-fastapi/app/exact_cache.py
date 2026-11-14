"""Exact-match TTL cache: same key -> same value until it expires.

In-process and bounded (oldest entries are dropped first). Used for results that
are safe to reuse for a short while, e.g. read-only connector tool calls.
"""

import hashlib
import json
import time
from collections import OrderedDict
from typing import Any

from app.config import settings

TTL = settings.tool_cache_ttl


class ExactCache:
    def __init__(self, ttl: float = TTL, max_items: int = 512):
        self.ttl = ttl
        self.max_items = max_items
        self._data: OrderedDict[str, tuple[float, Any]] = OrderedDict()  # key -> (expires, value)
        self.hits = 0
        self.misses = 0

    @staticmethod
    def make_hash(*parts: Any) -> str:
        """Stable key for any JSON-able parts; dict key order doesn't matter."""
        raw = json.dumps(parts, sort_keys=True, default=str, separators=(",", ":"))
        return hashlib.sha256(raw.encode()).hexdigest()

    def get(self, key: str) -> Any | None:
        entry = self._data.get(key)
        if entry is None or entry[0] < time.monotonic():
            self._data.pop(key, None)
            self.misses += 1
            return None
        self._data.move_to_end(key)
        self.hits += 1
        return entry[1]

    def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        self._data[key] = (time.monotonic() + (self.ttl if ttl is None else ttl), value)
        self._data.move_to_end(key)
        while len(self._data) > self.max_items:
            self._data.popitem(last=False)

    def drop(self, prefix: str) -> None:
        """Forget every key starting with prefix (keys built as '<scope>:<hash>')."""
        for key in [k for k in self._data if k.startswith(prefix)]:
            del self._data[key]
