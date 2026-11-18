import logging

from agno.agent import Agent

from app.agent import primary_model

logger = logging.getLogger(__name__)

# No db, memory or tools: a one-shot call that never touches the user's session history.
title_agent = Agent(
    model=primary_model,
    instructions=[
        "Write a short title (2 to 6 words) for a chat that starts with the user's message.",
        "Capture the topic or intent, not the first words. Same language as the message.",
        "Reply with the title only: no quotes, no trailing punctuation, no markdown.",
    ],
    telemetry=False,
)


def clean_title(raw: str, limit: int = 60) -> str | None:
    lines = (raw or "").strip().splitlines()
    title = lines[0].strip().strip("\"'`*# ").rstrip(".") if lines else ""
    if not title:
        return None
    return title if len(title) <= limit else title[:limit].rsplit(" ", 1)[0] + "…"


async def generate_title(message: str) -> str | None:
    """A context-based title, or None on any failure (the caller keeps its fallback)."""
    try:
        run = await title_agent.arun(message[:2000], stream=False)
        return clean_title(str(run.content or ""))
    except Exception:
        logger.warning("title generation failed", exc_info=True)
        return None
