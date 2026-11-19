"""The agent's LLMs: Gemini/Groq per settings, with a fallback chain."""
import os

from agno.models.fallback import FallbackConfig
from agno.utils.log import logger

from app.agent.reasoning_groq import ReasoningGroq
from app.config import settings


def gemini_models() -> list:
    """Gemini models from settings, in order. Empty if no key or no SDK."""
    api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("No GEMINI_API_KEY: only Groq is available")
        return []
    try:
        from agno.models.google import Gemini  # needs the google-genai package
    except ImportError:
        logger.warning("google-genai not installed: only Groq is available")
        return []
    return [
        Gemini(
            id=model_id.strip(), api_key=api_key, timeout=settings.gemini_timeout,
            # Thought summaries stream as reasoning_content before the answer (the UI
            # shows them as "Thinking"). flash-lite only thinks with a thinking level set.
            include_thoughts=True,
            thinking_level=settings.gemini_thinking_level or None,
        )
        for model_id in settings.gemini_models.split(",") if model_id.strip()
    ]


def model_chain():
    """(primary model, FallbackConfig) per settings.primary_model.

    Gemini is the default: on the free tiers it took 6 x 12k-token requests in a
    row without a 429, while Groq's gpt-oss-120b allows 8k tokens/minute in total
    (x-ratelimit-limit-tokens), so a single tool-heavy turn could exhaust it.
    """
    # No SDK retries: on a 429 the Groq SDK would sleep for `retry-after` (up to 60s,
    # twice) before agno ever tried a fallback. Fail fast and fall over instead.
    groq = ReasoningGroq(id=settings.groq_model, max_retries=0, timeout=settings.groq_timeout)
    gemini = gemini_models()

    if settings.primary_model == "gemini" and gemini:
        primary, fallbacks = gemini[0], gemini[1:] + [groq]
    else:
        primary, fallbacks = groq, gemini
    if not fallbacks:
        return primary, None

    def on_fallback(primary: str, fallback: str, error: Exception) -> None:
        logger.warning("model fallback %s -> %s: %s", primary, fallback, str(error)[:200])

    return primary, FallbackConfig(
        on_rate_limit=fallbacks,
        on_context_overflow=fallbacks,  # e.g. Groq 413 "request too large for your TPM"
        on_error=fallbacks,  # 5xx / network; agno never masks 401/403 config errors
        callback=on_fallback,
    )


primary_model, fallbacks = model_chain()
logger.info(f"model: {primary_model.id}, fallbacks: {[m.id for m in fallbacks.on_error] if fallbacks else []}")
