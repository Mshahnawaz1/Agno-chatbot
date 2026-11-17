"""The renderer capabilities handshake: which catalogs this request's renderer can draw.

The client sends `a2uiRendererCapabilities` ({"1.0": {"supportedCatalogIds": [...]}}), built from
the catalog it really has. The server negotiates it against the agent's catalogs with the SDK
(`A2uiGenerator.create_processor`), so a renderer that doesn't know our catalog is refused up
front instead of being sent surfaces it cannot draw. A request without capabilities (a plain
script, an old client) gets the default: the chat catalog.

`new_processor()` in catalog.py reads `current()`, so code that builds processors (turn.py,
store.py) needs no change: the route sets the capabilities around it with `use()`.
"""

from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any

_current: ContextVar[dict[str, Any] | None] = ContextVar("a2ui_renderer_capabilities", default=None)


def current() -> dict[str, Any] | None:
    return _current.get()


@contextmanager
def use(capabilities: dict[str, Any] | None) -> Iterator[None]:
    token = _current.set(capabilities)
    try:
        yield
    finally:
        _current.reset(token)
