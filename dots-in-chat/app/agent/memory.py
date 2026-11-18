"""Agentic memory that doesn't hold up the reply.

agno's own `update_user_memory` (enable_agentic_memory) runs a nested LLM loop inside the
tool call: the user waited 5-10s (logged: "update_user_memory took 5.56s", 10.09s max) for
a note the reply doesn't depend on. This tool has the same name and signature but returns at
once and writes the memory in the background. Memories reach the prompt on the next message
(add_memories_to_context), which is when they are needed.
"""
import asyncio

from agno.memory import MemoryManager
from agno.run import RunContext
from agno.utils.log import logger

MEMORY_INSTRUCTIONS = (
    "When the user shares a lasting fact or preference about themselves (name, role, location, "
    "tastes), or asks you to remember, forget or change something, call update_user_memory once "
    "with a specific description. It returns immediately; don't wait on it or mention it."
)

_pending: set[asyncio.Task] = set()  # strong refs: the loop keeps only weak ones to tasks


def make_memory_tool(memory_manager: MemoryManager):
    async def update_user_memory(task: str, run_context: RunContext) -> str:
        """Save, update or delete something remembered about the user. Describe the change in detail.

        Args:
            task: What to add, update or delete, in a specific sentence.
        """
        user_id = run_context.user_id

        async def run() -> None:
            try:
                await memory_manager.aupdate_memory_task(task=task, user_id=user_id)
            except Exception:
                logger.exception("background memory update failed")

        t = asyncio.create_task(run())
        _pending.add(t)
        t.add_done_callback(_pending.discard)
        return "Memory update queued."

    return update_user_memory
