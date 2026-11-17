"""The chat agent package: `from app.agent import agent`."""
from app.agent.core import agent
from app.agent.knowledge import warm_embedder

__all__ = ["agent", "warm_embedder"]
