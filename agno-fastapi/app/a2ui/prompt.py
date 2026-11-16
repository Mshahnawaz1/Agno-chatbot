"""What the agent is told about interactive UI.

Two halves: the SDK's generated snippet (how to write A2UI for this catalog, catalog.py) and
the judgement written here (when to show UI, and how to treat surfaces across turns).
"""

from app.a2ui.catalog import PROMPT_SNIPPET

# One line for the top of the system prompt: models weigh early instructions most.
A2UI_RULE = (
    "Whenever your reply needs the user to choose, pick, confirm or fill in details, show an "
    "interactive form (see <interactive_ui>) instead of listing questions or options as text."
)

GUIDE = """## When to show UI (follow strictly)
You MUST use a form whenever your reply would otherwise:
- ask the user a question that has a known set of answers (preferences, type, style, yes/no)
- ask for two or more details (e.g. destination, dates, budget, group size)
- offer options, recommendations or plans to pick from
- need confirmation before you create, change, send or delete something
- need a date, time, number, amount or rating from the user
Never write those questions or options as a list in text. Put ALL of them in ONE form with one
submit button, then stop and wait for the answer.
You MAY also show results as a card (weather, a schedule, a comparison) when that reads better
than prose. Do NOT use UI for plain answers, explanations or code.

## How to write it
- One short sentence of text, then the block. Don't repeat in text what the surface shows
  (its questions, numbers or tables): the user sees both.
- Charts, graphs, plots and live calculators: see VegaChart under Catalog Instructions.
- Headings are Markdown inside Text ("### Trip details"); Text variants are only body and caption.
- Tables are Markdown tables inside one Text.
- A Button's child is a component, not a string: `Button(Text("Plan my trip"), "primary", Event(...))`.
- `root` must be assigned a component call: `root = Card(...)`. Never alias it to another
  variable (`card = Card(...)` then `root = card` is rejected and nothing is shown).
- Bind every input to the data model ($/form/<field>), set sensible defaults with
  `$/form/<field> = ...`, and pass every field in the submit button's Event context.

## Surfaces across turns
Surfaces you showed earlier still exist.
- To change one in place, start the block with `surface("<its surfaceId>", update=true)` and send
  only what changes: new data (`$/path = value`), or components that keep their names.
  `surface("<existing id>")` without update=true is rejected.
- Every component a surface already has must stay reachable from its root; an update that
  drops one is rejected (A2UI can't remove single components). To change a surface's layout
  (add a chart, drop a section), delete it and create a new surface with a new id, in one block.
- To show something new (e.g. a confirmation after a form is submitted), use a new surfaceId.
- To remove one, write the delete command alone, with no `surface(...)` line for it:
  <a2ui>
  deleteSurface("<its surfaceId>")
  </a2ui>
Everything A2UI, deletes included, goes inside <a2ui> tags; outside them it is shown as text.

## After a click
A message starting "User action:" is the user's answer from a surface: act on it right away
(answer, plan, or call a tool) and don't show the same form again. If something essential is
still missing, ask for only that, again with a form."""

A2UI_INSTRUCTIONS = f"<interactive_ui>\n{GUIDE}\n\n{PROMPT_SNIPPET}\n</interactive_ui>"

REPAIR_PROMPT = """The A2UI compiler rejected part of your last reply, so the user did not see it:
{errors}
Surfaces that exist now: {surfaces}.
Send only a corrected A2UI block that completes the UI, with the same surfaceId. If that surface
exists, update it with `surface("<id>", update=true)`; if it doesn't, create it with
`surface("<id>")`. Keep prose outside the <a2ui> tags. Don't apologise or explain."""
