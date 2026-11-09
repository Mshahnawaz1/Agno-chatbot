from agno.tools import tool

import httpx

from app.config import settings



@tool(cache_results=True, cache_ttl=settings.tool_cache_ttl, cache_dir=settings.tool_cache_dir)
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    r = httpx.get(f"https://wttr.in/{city}?format=3")
    return r.text

@tool(cache_results=True, cache_ttl=settings.tool_cache_ttl, cache_dir=settings.tool_cache_dir)
def primes_below(limit: int):
    """Get all the primes below the limit."""
    # Sieve of Eratosthenes
    if limit < 2:
        return []
    flags = [True] * (limit + 1)
    flags[0] = flags[1] = False
    for i in range(2, int(limit ** 0.5) + 1):
        if flags[i]:
            flags[i * i : limit + 1 : i] = [False] * len(range(i * i, limit + 1, i))
    return [n for n, is_prime in enumerate(flags) if is_prime]
