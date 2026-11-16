"""One assistant turn, compiled while it streams.

The model's text goes in chunk by chunk. Out come chat events: plain text, compiled A2UI wire
messages (one per finished Express statement, so surfaces render progressively), and the
errors of blocks the compiler rejected. A rejected block never reaches the client; its errors
drive one repair round (see app/routers/chat.py).
"""

from typing import Any

from a2ui.parser import A2uiPart, ErrorPart, TextPart

from app.a2ui.catalog import new_processor
from app.a2ui.prompt import REPAIR_PROMPT
from app.a2ui.store import Part, load_state, save_parts

Event = tuple[str, dict[str, Any]]  # (SSE event name, data)

# Compiler errors whose wording doesn't point at the mistake the model made (seen live), with
# what to do instead. Matched on the error text; added to the repair prompt.
HINTS = {
    "Surface not found for message": (
        "`root` was not assigned a component call, so the surface was never created. Assign it"
        " directly (`root = Card(...)`), never through another variable (`root = card`)."
    ),
    "is not reachable from": (
        "An update dropped a component the surface already had. Keep it, or delete the surface"
        " and create a new one with a new id in the same block."
    ),
}


def _hint(error: str) -> str:
    return "".join(f"\n  Fix: {fix}" for key, fix in HINTS.items() if key in error)


class A2uiTurn:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self._processor = new_processor()
        # The surfaces earlier turns created, so this turn can update or delete them.
        self._state = load_state(session_id, self._processor)
        self.parts: list[Part] = []  # what the user saw, in order; stored when the turn ends
        self.rejected: list[str] = []
        self._stream = None

    @property
    def surface_ids(self) -> list[str]:
        return list(self._state.surface_ids)

    def start_pass(self) -> None:
        """Starts reading one model run (the reply, or a repair)."""
        self.rejected = []
        self._stream = self._processor.open_stream(state=self._state, after_rejected_block="continue")

    def feed(self, chunk: str) -> list[Event]:
        return self._events(self._stream.feed(chunk))

    def close(self) -> list[Event]:
        return self._events(self._stream.close())

    def repair_prompt(self) -> str:
        return REPAIR_PROMPT.format(
            errors="\n".join(f"- {e}{_hint(e)}" for e in self.rejected),
            surfaces=", ".join(self.surface_ids) or "none (create the surface)",
        )

    def save(self, run_id: str | None) -> None:
        if run_id:
            save_parts(self.session_id, run_id, self.parts)

    def _events(self, parts) -> list[Event]:
        out: list[Event] = []
        for part in parts:
            if isinstance(part, TextPart):
                if part.text:
                    self._add_text(part.text)
                    out.append(("token", {"content": part.text}))
            elif isinstance(part, A2uiPart):
                for m in part.a2ui:
                    message = m.model_dump(by_alias=True, exclude_unset=True)
                    self.parts.append({"type": "a2ui", "message": message})
                    out.append(("a2ui", {"message": message}))
            elif isinstance(part, ErrorPart):
                self.rejected.append(str(part.error))
                out.append(("a2ui_error", {"error": str(part.error)[:2000]}))
        return out

    def _add_text(self, text: str) -> None:
        if self.parts and self.parts[-1]["type"] == "text":
            self.parts[-1]["text"] += text
        else:
            self.parts.append({"type": "text", "text": text})
