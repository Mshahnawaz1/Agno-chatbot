"""One assistant turn, compiled while it streams.

The model's text goes in chunk by chunk. Out come chat events: plain text, compiled A2UI wire
messages (one per finished Express statement, so surfaces render progressively), and the
errors of blocks the compiler rejected. A rejected block never reaches the client; its errors
drive one repair round (see app/routers/chat.py).
"""

import re
from typing import Any

from a2ui.parser import A2uiPart, ErrorPart, TextPart

from app.a2ui.catalog import CATALOG, new_processor
from app.a2ui.prompt import REPAIR_PROMPT
from app.a2ui.store import Part, keep_earlier_surfaces, load_state, save_parts

Event = tuple[str, dict[str, Any]]  # (SSE event name, data)

# Compiler errors whose wording doesn't point at the mistake the model made (seen live), with
# what to do instead. Matched on the error text; added to the repair prompt.
HINTS = {
    "Surface not found for message": (
        "`root` was not assigned a component call, so the surface was never created. Assign it"
        " directly (`root = Card(...)`), never through another variable (`root = card`)."
    ),
    "not defined in catalog": (
        "That component does not exist. Components: {components}. Their signatures are in the a2ui"
        " skill (references/components.md, chart.md, block-<name>.md)."
    ),
    "references non-existent component": (
        "A string was passed where a component is expected, e.g. a Button's child. Use"
        ' `Button(Text("Plan my trip"), "primary", Event(...))`.'
    ),
    "is not reachable from": (
        "An update dropped a component the surface already had. Keep it, or delete the surface"
        " and create a new one with a new id in the same block."
    ),
}


# `surface("<id>")` alone on a line: the start of a block for that surface.
_SURFACE_LINE = re.compile(r'^(\s*surface\(\s*"([^"]+)"\s*)\)(\s*)$')
_SURFACE_START = "surface("


def _hint(error: str) -> str:
    names = ", ".join(sorted(CATALOG.components))
    return "".join(f"\n  Fix: {fix.format(components=names)}" for key, fix in HINTS.items() if key in error)


class A2uiTurn:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self._processor = new_processor()
        # The surfaces earlier turns created, so this turn can update or delete them.
        self._state = load_state(session_id, self._processor)
        self.parts: list[Part] = []  # what the user saw, in order; stored when the turn ends
        self.rejected: list[str] = []
        self._stream = None
        # Deletes wait for the end of the turn: one that only clears the way for a new surface
        # is dropped (see keep_earlier_surfaces), so earlier messages keep their cards.
        self._held: list[Part] = []
        self._line = ""  # an unfinished line that may be a `surface(...)` statement
        self.upgraded: list[str] = []  # surfaces whose `surface(id)` became an update

    @property
    def surface_ids(self) -> list[str]:
        return list(self._state.surface_ids)

    def start_pass(self) -> None:
        """Starts reading one model run (the reply, or a repair)."""
        self.rejected = []
        self._line = ""
        self._stream = self._processor.open_stream(state=self._state, after_rejected_block="continue")

    def feed(self, chunk: str) -> list[Event]:
        return self._events(self._stream.feed(self._upgrade(chunk)))

    def close(self) -> list[Event]:
        tail, self._line = self._line, ""
        return self._events(self._stream.feed(self._fix_line(tail)) + self._stream.close())

    def _upgrade(self, chunk: str) -> str:
        """Passes text through, holding back only a line that may be `surface("<id>")`.

        Writing `surface("<existing id>")` again to redraw a surface (seen live: "make it 20
        years") is rejected, and fixing it took a whole repair run. Its meaning is clear, so the
        line becomes `surface("<id>", update=true)` here, with no model call.
        """
        text = self._line + chunk
        lines = text.split("\n")
        self._line = lines.pop()
        out = "".join(self._fix_line(line) + "\n" for line in lines)
        stripped = self._line.lstrip()
        if not (stripped.startswith(_SURFACE_START) or _SURFACE_START.startswith(stripped or "x")):
            out, self._line = out + self._line, ""
        return out

    def _fix_line(self, line: str) -> str:
        m = _SURFACE_LINE.match(line)
        if m and m.group(2) in self._state.surface_ids:
            self.upgraded.append(m.group(2))
            return f"{m.group(1)}, update=true){m.group(3)}"
        return line

    def repair_prompt(self) -> str:
        return REPAIR_PROMPT.format(
            errors="\n".join(f"- {e}{_hint(e)}" for e in self.rejected),
            surfaces=", ".join(self.surface_ids) or "none (create the surface)",
        )

    def finish(self) -> list[Event]:
        """Ends the turn (after any repair): sends the held deletes that still apply."""
        held, self._held = self._held, []
        out: list[Event] = []
        for part in keep_earlier_surfaces(self.parts + held)[len(self.parts):]:
            self.parts.append(part)
            out.append(("a2ui", {"message": part["message"]}))
        return out

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
                    if "deleteSurface" in message:
                        self._held.append({"type": "a2ui", "message": message})
                        continue
                    created = (message.get("createSurface") or {}).get("surfaceId")
                    for held in [h for h in self._held if h["message"]["deleteSurface"]["surfaceId"] == created]:
                        # Delete then create of the same id: a real replacement, sent in order.
                        self._held.remove(held)
                        self.parts.append(held)
                        out.append(("a2ui", {"message": held["message"]}))
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
