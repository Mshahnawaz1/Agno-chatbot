"""Chat runs that outlive the HTTP connection that started them.

A run's SSE chunks are buffered here while a background task produces them. Any number of
readers can follow a run from its first chunk, so a client that switched to another chat (or
reloaded) can re-attach later and replay what it missed. Only an explicit cancel stops a run.
"""

import asyncio
from collections.abc import AsyncIterator, Callable


class LiveRun:
    def __init__(self) -> None:
        self.chunks: list[str] = []
        self.finished = False
        self.task: asyncio.Task | None = None
        self._cond = asyncio.Condition()

    async def _publish(self, chunk: str) -> None:
        async with self._cond:
            self.chunks.append(chunk)
            self._cond.notify_all()

    async def _finish(self) -> None:
        async with self._cond:
            self.finished = True
            self._cond.notify_all()

    async def follow(self) -> AsyncIterator[str]:
        """Every chunk from the start of the run, then waits for new ones until it ends."""
        i = 0
        while True:
            async with self._cond:
                await self._cond.wait_for(lambda: i < len(self.chunks) or self.finished)
                if i >= len(self.chunks):
                    return
                chunk = self.chunks[i]
            i += 1
            yield chunk

    def cancel(self) -> None:
        if self.task and not self.task.done():
            self.task.cancel()


_runs: dict[str, LiveRun] = {}  # session_id -> its running run


def get(session_id: str) -> LiveRun | None:
    return _runs.get(session_id)


def start(session_id: str, make_stream: Callable[[], AsyncIterator[str]]) -> LiveRun:
    """Starts a run for the session; the caller has checked there is none running."""
    run = LiveRun()
    _runs[session_id] = run

    async def pump() -> None:
        stream = make_stream()
        try:
            async for chunk in stream:
                await run._publish(chunk)
        finally:
            try:
                await stream.aclose()
            finally:
                if _runs.get(session_id) is run:
                    del _runs[session_id]
                await asyncio.shield(run._finish())

    run.task = asyncio.create_task(pump())
    return run
