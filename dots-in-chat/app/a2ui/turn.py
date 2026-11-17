"""One assistant turn, compiled while it streams.

The model's text goes in chunk by chunk. Out come chat events: plain text, compiled A2UI wire
messages, and the errors of blocks the compiler rejected. Its errors drive one repair round
(see app/routers/chat.py).

Progressive rendering: a block that creates a NEW surface streams its messages as each Express
statement compiles, so components appear while the model is still writing. If the block then
fails, the surface is retracted (an `a2ui_retract` event; the client drops its messages) and
leaves no trace in the stored parts, so a rejected block never leaves a half-built surface.
A block that changes an existing surface (update, replace) cannot be undone on the client, so
its messages wait until the block ends, and a failing block drops them.
"""

import re
from typing import Any

from a2ui.parser import A2uiPart, ErrorPart, TextPart

from app.a2ui.catalog import CATALOG, new_processor
from app.a2ui.prompt import REPAIR_PROMPT
from app.a2ui import vegacheck
from app.a2ui.store import Part, keep_earlier_surfaces, load_state, save_parts

Event = tuple[str, dict[str, Any]]  # (SSE event name, data)
RAW_MAX = 4000  # chars of the rejected reply that a repair prompt quotes

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
    "extraneous input ':'": (
        "Named arguments are written name=value (`title=\"Budget\"`), never name: value. A colon"
        " is only for keys inside {maps}, e.g. `{label: \"Rent\", percent: 40}`."
    ),
    "is not reachable from": (
        "An update dropped a component the surface already had. Keep it, or delete the surface"
        " and create a new one with a new id in the same block."
    ),
}


# `surface("<id>")` alone on a line: the start of a block for that surface.
_SURFACE_LINE = re.compile(r'^(\s*surface\(\s*"([^"]+)"\s*)\)(\s*)$')
_SURFACE_START = "surface("


_BLOCK = re.compile(r"<a2ui>\n.*?</a2ui>", re.DOTALL)
_IDENT = re.compile(r"[A-Za-z_]\w*$")


def fix_named_args(block: str) -> str:
    """The block with `name: value` call arguments rewritten to `name=value`.

    Models mix the two (seen live: `BudgetSplit(..., title: "Budget")` failed three repair
    runs in a row, and the chart never showed). A colon directly inside parentheses, after an
    identifier that follows `(` or `,`, can only be that mistake; colons inside {maps} and
    strings are keys and text and stay.
    """
    out: list[str] = []
    stack: list[str] = []
    quote = ""
    i = 0
    while i < len(block):
        ch = block[i]
        if quote:
            if ch == "\\":
                out.append(block[i : i + 2])
                i += 2
                continue
            if ch == quote:
                quote = ""
        elif ch in "\"'":
            quote = ch
        elif ch in "([{":
            stack.append(ch)
        elif ch in ")]}" and stack:
            stack.pop()
        elif ch == ":" and stack and stack[-1] == "(":
            before = "".join(out).rstrip()
            m = _IDENT.search(before)
            if m and before[: m.start()].rstrip().endswith(("(", ",")):
                out.append("=")
                i += 1
                while i < len(block) and block[i] in " \t":  # `title: "x"` -> `title="x"`
                    i += 1
                continue
        out.append(ch)
        i += 1
    return "".join(out)


def _hint(error: str) -> str:
    names = ", ".join(sorted(CATALOG.components))
    return "".join(f"\n  Fix: {fix.replace("{components}", names)}" for key, fix in HINTS.items() if key in error)


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
        self._raw = ""  # what the model wrote in this pass, for the repair prompt
        # Compiled messages wait here until the pass reaches plain text or its end, and a block
        # that fails drops its own: a half-compiled block (the `root` line compiled, a later line
        # failed) used to reach the client as a surface whose children were never defined.
        self._pending: list[dict] = []
        self._boundary = 0  # where the current block's messages start in _pending
        self._closed = 0  # `</a2ui>` tags seen in _raw
        self._live: dict[str, list[Part]] = {}  # surfaces the open block streams, with their parts
        self._base_ids: set[str] = set()  # surfaces that existed when the pass started
        self._failed = False  # the open block failed: the rest of it is ignored
        self._dirty = False  # a block failed: the renderer state may hold its half-built surface

    def _rebuilt_state(self):
        """The renderer state without anything a failed block half-built: earlier turns' surfaces
        plus what this turn actually showed."""
        state = load_state(self.session_id, self._processor)
        shown = [p["message"] for p in self.parts if p["type"] == "a2ui"]
        if shown:
            state.apply(shown)
        return state

    @property
    def surface_ids(self) -> list[str]:
        return list((self._rebuilt_state() if self._dirty else self._state).surface_ids)

    def start_pass(self) -> None:
        """Starts reading one model run (the reply, or a repair)."""
        if self._dirty:
            self._state, self._dirty = self._rebuilt_state(), False
        self.rejected = []
        self._raw = ""
        self._pending, self._boundary, self._closed = [], 0, 0
        self._line = ""
        self._live, self._failed = {}, False
        self._base_ids = set(self._state.surface_ids)
        self._stream = self._processor.open_stream(state=self._state, after_rejected_block="continue")

    def feed(self, chunk: str) -> list[Event]:
        out: list[Event] = []
        # One piece per block end, so a chunk holding the end of one block and the start of the
        # next never lets the second block's messages count as final.
        for piece in re.split(r"(?<=</a2ui>)", chunk):
            self._raw += piece
            out += self._events(self._stream.feed(self._upgrade(piece)))
            if self._raw.count("</a2ui>") > self._closed:  # a block ended: its messages are final
                self._closed = self._raw.count("</a2ui>")
                self._boundary = len(self._pending)
                self._live, self._failed = {}, False
        return out

    def close(self) -> list[Event]:
        tail, self._line = self._line, ""
        out = self._events(self._stream.feed(self._fix_line(tail)) + self._stream.close())
        self._flush(out)
        self._live = {}
        return out

    def autofix(self) -> list[Event]:
        """Re-reads the rejected blocks with `name: value` arguments rewritten (fix_named_args):
        no model call. Returns their events; `rejected` is what is still wrong afterwards."""
        if not self.rejected:
            return []
        raw, before = self._raw, self.rejected
        blocks = _BLOCK.findall(raw)
        fixed = [fix_named_args(b) for b in blocks]
        changed = [f for b, f in zip(blocks, fixed) if f != b]
        if not changed:
            return []
        self._dirty = True
        self.start_pass()
        events = self.feed("\n".join(changed)) + self.close()
        self._raw = raw  # the repair prompt quotes what the model wrote
        if self.rejected:
            self.rejected = before + self.rejected
        return events

    def give_up(self) -> list[Event]:
        """The note shown when a block could not be drawn, so the reply's own sentence ("here is
        your chart") is not left standing alone."""
        note = "\n\n_I couldn't draw that card. Please ask again, or rephrase._"
        self._add_text(note)
        return [("token", {"content": note})]

    def _flush(self, out: list[Event]) -> None:
        for message in self._pending:
            self._emit(message, out)
        self._pending, self._boundary = [], 0

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
            return f"{m.group(1)}, update=true){m.group(3)}"
        return line

    def repair_prompt(self) -> str:
        prompt = REPAIR_PROMPT.format(
            previous=self._raw[-RAW_MAX:],
            errors="\n".join(f"- {e}{_hint(e)}" for e in self.rejected),
            surfaces=", ".join(self.surface_ids) or "none (create the surface)",
        )
        if any(e.startswith(vegacheck.PREFIX) for e in self.rejected):
            prompt += f"\n\nWorking VegaChart specs; copy the one that fits and change only its data:\n{vegacheck.recipes()}"
        return prompt

    def finish(self) -> list[Event]:
        """Ends the turn (after any repair): sends the held deletes that still apply."""
        held, self._held = self._held, []
        out: list[Event] = []
        for part in keep_earlier_surfaces(self.parts + held)[len(self.parts):]:
            self.parts.append(part)
            out.append(("a2ui", {"message": part["message"]}))
        return out

    def save(self, run_id: str | None) -> None:
        for parts in self._live.values():  # the stream ended inside a block: its surface is unfinished
            self.parts[:] = [p for p in self.parts if not any(p is q for q in parts)]
        self._live = {}
        if run_id:
            save_parts(self.session_id, run_id, self.parts)

    def _events(self, parts) -> list[Event]:
        out: list[Event] = []
        for part in parts:
            if isinstance(part, TextPart):
                if part.text:
                    self._flush(out)  # plain text can't arrive inside a block: the block is final
                    self._add_text(part.text)
                    out.append(("token", {"content": part.text}))
            elif isinstance(part, A2uiPart):
                messages = [m.model_dump(by_alias=True, exclude_unset=True) for m in part.a2ui]
                if bad := vegacheck.problems(messages):  # a chart that would draw nothing
                    for error in bad:
                        self.rejected.append(error)
                        out.append(("a2ui_error", {"error": error[:2000]}))
                    self._fail_block(out)
                elif not self._failed:
                    for message in messages:
                        self._route(message, out)
            elif isinstance(part, ErrorPart):
                self.rejected.append(str(part.error))
                out.append(("a2ui_error", {"error": str(part.error)[:2000]}))
                self._fail_block(out)
        return out

    def _fail_block(self, out: list[Event]) -> None:
        """The open block failed: drop its waiting messages and retract the surfaces it streamed."""
        del self._pending[self._boundary :]
        for surface_id, parts in self._live.items():
            self.parts[:] = [p for p in self.parts if not any(p is q for q in parts)]
            out.append(("a2ui_retract", {"surfaceId": surface_id}))
        self._live, self._failed, self._dirty = {}, True, True

    def _route(self, message: dict, out: list[Event]) -> None:
        """Streams a message of a new surface now; anything else waits for the block to end."""
        body = next((v for k, v in message.items() if k != "version" and isinstance(v, dict)), {})
        surface_id = body.get("surfaceId")
        is_new = (
            "createSurface" in message
            and surface_id not in self._base_ids
            and surface_id not in self._live
            and not any(h["message"]["deleteSurface"]["surfaceId"] == surface_id for h in self._held)
        )
        if is_new:
            self._live[surface_id] = []
        if surface_id in self._live:
            before = len(self.parts)
            self._emit(message, out)
            self._live[surface_id] += self.parts[before:]
        else:
            self._pending.append(message)

    def _emit(self, message: dict, out: list[Event]) -> None:
        if "deleteSurface" in message:
            self._held.append({"type": "a2ui", "message": message})
            return
        created = (message.get("createSurface") or {}).get("surfaceId")
        for held in [h for h in self._held if h["message"]["deleteSurface"]["surfaceId"] == created]:
            # Delete then create of the same id: a real replacement, sent in order.
            self._held.remove(held)
            self.parts.append(held)
            out.append(("a2ui", {"message": held["message"]}))
        self.parts.append({"type": "a2ui", "message": message})
        out.append(("a2ui", {"message": message}))

    def _add_text(self, text: str) -> None:
        if self.parts and self.parts[-1]["type"] == "text":
            self.parts[-1]["text"] += text
        else:
            self.parts.append({"type": "text", "text": text})
