"""Macros: composite components the model writes in one call, lowered to basic components here.

A macro (SDK `a2ui.transformers.macros`) is a Python function that returns a tree of basic
components. The model sees it as one component in the `dots-in-chat/macros/v1` catalog (its
signature comes from the function's annotations and docstring); before a message reaches the
client, `lower` expands every macro call into its basic subtree. So a KPI tile costs the model
one short line instead of a Column of three Texts, and the renderer needs nothing new.

The expansion keeps the macro call's id on the subtree's root (`tile` stays `tile`, its parts
are `tile__text_1`, ...), so a later turn can still replace `tile` by writing it again.

The macros are plain layout: they only use basic components, so what they draw is always what
the basic catalog can draw.
"""

from collections.abc import Sequence
from typing import Any, Literal

from a2ui.builder.v1_0 import Action, Button, Card, Column, DynamicString, Icon, Row, Text
from a2ui.core.schema.v1_0 import AgentToRendererMessage
from pydantic import TypeAdapter
from a2ui.transformers.macros import MacroExpander, macro

MACROS_ID = "dots-in-chat/macros/v1"

_ICONS = {"info": "info", "success": "check", "warning": "warning", "error": "error"}


@macro
def StatTile(label: DynamicString, value: DynamicString, note: DynamicString = "") -> Column:
    """A KPI: a small label, its value under it, and an optional note.

    Args:
        label: What is measured, e.g. "Monthly saving".
        value: The number or short text, e.g. "₹12,400".
        note: Optional caption under the value, e.g. "up 8% on last month".
    """
    parts = [Text(text=label, variant="caption"), Text(text=value, variant="body")]
    if note:
        parts.append(Text(text=note, variant="caption"))
    return Column(children=parts)


@macro
def InfoRow(label: DynamicString, value: DynamicString) -> Row:
    """One line of a details list: the label at the left, its value at the right.

    Args:
        label: The field name, e.g. "Check-in".
        value: Its value, e.g. "14 March".
    """
    return Row(children=[Text(text=label, variant="caption"), Text(text=value, variant="body")], justify="spaceBetween")


@macro
def Callout(
    title: DynamicString,
    body: DynamicString,
    tone: Literal["info", "success", "warning", "error"] = "info",
) -> Card:
    """A highlighted note with an icon: a tip, a confirmation, a warning or an error.

    Args:
        title: A few words, e.g. "Heads up".
        body: One or two sentences.
        tone: Which icon it carries: info, success, warning or error.
    """
    return Card(
        child=Row(
            children=[Icon(name=_ICONS[tone]), Column(children=[Text(text=title, variant="body"), Text(text=body, variant="caption")])],
            align="center",
        )
    )


@macro
def ConfirmBar(
    question: DynamicString,
    on_confirm: Action,
    on_cancel: Action,
    confirm_label: str = "Confirm",
    cancel_label: str = "Cancel",
) -> Column:
    """Asks the user to confirm before you create, change, send or delete something.

    Args:
        question: What is about to happen, e.g. "Delete the 3 draft emails?".
        on_confirm: The Event sent when they confirm.
        on_cancel: The Event sent when they cancel.
        confirm_label: Text of the confirm button.
        cancel_label: Text of the cancel button.
    """
    return Column(
        children=[
            Text(text=question, variant="body"),
            Row(
                children=[
                    Button(child=Text(text=confirm_label), action=on_confirm, variant="primary"),
                    Button(child=Text(text=cancel_label), action=on_cancel, variant="borderless"),
                ]
            ),
        ]
    )


MACROS = [StatTile, InfoRow, Callout, ConfirmBar]

# What the macro catalog tells the model (it goes under "Catalog Instructions" of the macros catalog).
INSTRUCTIONS = (
    "These are shortcuts made of basic components: use them instead of building the same Column or "
    "Row by hand. They can sit anywhere a basic component can (inside a Card, Column, Row, List).\n"
    "Example:\n"
    '  root = Card(Column([stats, when, tip, ask]))\n'
    '  stats = Row([StatTile("Saved", "₹12,400", "up 8%"), StatTile("Goal", "₹50,000")])\n'
    '  when = InfoRow("Check-in", "14 March")\n'
    '  tip = Callout("Heads up", "Prices change daily.", "warning")\n'
    '  ask = ConfirmBar("Send these 3 emails?", Event("confirm_send"), Event("cancel_send"), "Send")'
)


def new_expander() -> MacroExpander:
    return MacroExpander(MACROS, catalog_id=MACROS_ID)


def lower(expander: MacroExpander, messages: Sequence[AgentToRendererMessage]) -> list[AgentToRendererMessage]:
    """The messages with every macro call expanded into basic components.

    Every surface of this app has no default catalog (each component names its own), which the
    expander is told per call, so one expander serves any number of surfaces and turns.
    """
    surfaces: dict[str, str | None] = {}
    for message in messages:
        dumped = message.model_dump(by_alias=True, exclude_unset=True)
        body = dumped.get("createSurface") or dumped.get("updateComponents") or {}
        if body.get("surfaceId"):
            surfaces[body["surfaceId"]] = None
    return expander.transform_to_transport(messages, surface_catalogs=surfaces)


# --- keeping the macro form for the model -------------------------------------------------------
# The renderer state the model reads back (to update or delete a surface) is built from the
# stored messages, which are the lowered ones. A macro call replaced by a later turn would then
# leave its old expansion orphaned. So the root of every expansion carries the call it came from,
# in its metadata, and `raise_message` turns the expansion back into the call when a state is
# rebuilt. The client ignores component metadata.

EXTENSION = "dotsMacro"
_MESSAGE = TypeAdapter(AgentToRendererMessage)
_BODIES = ("createSurface", "updateComponents")


def _calls(messages: Sequence[dict]) -> dict[str, dict]:
    """The macro calls in the messages, by component id."""
    names = {m.__name__ for m in MACROS}
    return {
        c["id"]: c
        for message in messages
        for key in _BODIES
        for c in (message.get(key) or {}).get("components", [])
        if c.get("component") in names
    }


def lower_with_source(expander: MacroExpander, messages: Sequence[AgentToRendererMessage]) -> list[AgentToRendererMessage]:
    """`lower`, with each expansion's root remembering the macro call it came from."""
    calls = _calls([m.model_dump(by_alias=True, exclude_unset=True) for m in messages])
    lowered = lower(expander, messages)
    if not calls:
        return lowered
    out = []
    for message in lowered:
        dumped = message.model_dump(by_alias=True, exclude_unset=True)
        for key in _BODIES:
            for c in (dumped.get(key) or {}).get("components", []):
                if c["id"] in calls:
                    c["metadata"] = {"extensions": {EXTENSION: calls[c["id"]]}}
        out.append(_MESSAGE.validate_python(dumped))
    return out


def raise_message(message: dict[str, Any]) -> dict[str, Any]:
    """A stored (lowered) message with every expansion turned back into its macro call."""
    for key in _BODIES:
        body = message.get(key)
        if not isinstance(body, dict):
            continue
        comps = body.get("components", [])
        sources = {
            c["id"]: c["metadata"]["extensions"][EXTENSION]
            for c in comps
            if EXTENSION in ((c.get("metadata") or {}).get("extensions") or {})
        }
        if not sources:
            continue
        kept = [
            sources.get(c["id"], c)
            for c in comps
            if not any(c["id"].startswith(f"{root}__") for root in sources)
        ]
        return {**message, key: {**body, "components": kept}}
    return message
