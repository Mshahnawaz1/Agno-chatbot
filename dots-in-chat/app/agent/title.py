"""Short chat titles ("Monthly expense tracker") from the first message, like ChatGPT/Claude."""
from agno.agent import Agent
from agno.utils.log import logger

from app.agent.models import model_chain

_primary, _fallbacks = model_chain()
_titler = Agent(
    model=_primary,
    fallback_config=_fallbacks,
    instructions=(
        "Write a 2-5 word title for a chat that starts with the user's message. "
        "Name the topic, not the request: 'I want to track my monthly expenses' -> 'Monthly expense tracker'. "
        "Reply with the title only: no quotes, no trailing period."
    ),
)


async def generate_title(message: str) -> str | None:
    """None on any failure: the caller keeps the truncated-message title."""
    try:
        out = await _titler.arun(message[:1000])
        title = " ".join(str(out.content or "").split()).strip("\"'. ")
        return title[:60] or None
    except Exception:
        logger.exception("title generation failed")
        return None
