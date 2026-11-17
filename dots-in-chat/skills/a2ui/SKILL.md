---
name: a2ui
description: Interactive UI in replies. ALWAYS load it BEFORE replying when you would otherwise ask the user anything (a question, preferences, details, options, confirmation, a date or amount), e.g. "help me plan ...", "which one should I ...", or when you show a chart, card or calculation; plain-text questions are not allowed. Load it again for every reply that shows UI, also when earlier turns did. Has ready-made live blocks - investment/SIP growth, budget split, quadratic, chart switcher, rank list, reminder, and approval cards for messages, emails and orders - prefer them over computing results yourself.
metadata:
  preload: references/grammar.md
  default_paths: references/components.md references/form.md
  pairs: references/block-chart=references/chart-choice.md references/chart.md=references/chart-choice.md
---

# Interactive UI (A2UI Express)

## Match the request
First decide what the user asked for; then load the files in ONE call and use only components
named in them (never guess a component).

| The user | Show | Load (paths) |
|---|---|---|
| gave a salary and spending to split, or asks for a budget / 50-30-20 | BudgetSplit | references/block-budget.md |
| asks what a monthly investment / SIP grows to | GrowthCalculator | references/block-growth.md |
| wants a chart of up to ~12 values (give the numbers) | ChartSwitcher | references/block-charts.md |
| wants a chart of more points, several series, or a type not above (scatter, histogram, area, heatmap, radar, gauge, waterfall) | VegaChart: copy a recipe from the chart guide and change only its data | references/chart.md |
| asks which charts exist / lets you choose | ChartGallery; when a tile is tapped, draw that type with its recipe | references/block-chartgallery.md |
| wants to explore y = ax² + bx + c | QuadraticExplorer | references/block-quadratic.md |
| must rank 3-7 items | RankList | references/block-ranklist.md |
| wants a reminder | ReminderPicker | references/block-reminder.md |
| needs to approve a message / emails / a draft / an order | MessageApproval, BatchSend, DraftDiff, OrderReview | references/block-message.md, block-batch.md, block-draftdiff.md, block-order.md |
| needs to give you details or choose (trip, booking, preferences) | a form | no paths: you get components.md and form.md |
| key figures, a details list, a highlighted note, or "are you sure?" before you act | StatTile, InfoRow, Callout, ConfirmBar (shortcuts for basic components; mix them with any other) | references/macros.md |
| asks to explain / visualise how something works (a model, a system, a process, "explain X visually") | pipeline of stage Cards + a VegaChart of real numbers (never Mermaid, ASCII or a code block) | references/explain-visually.md, references/chart.md |
| wants something changed on a card from an earlier turn | update it | see "Earlier surfaces" |

Also available: references/functions.md (input checks beyond ?required, number/date formats), and
references/rpc.md (ask the user's browser for their timezone, locale or local time, with the
call_renderer_function tool; load it only when the answer depends on where or when the user is).
Any chart: the chart-choice guide comes with the chart files; follow it.

## When to show UI
- The user already gave everything needed: do it, no form. (A salary and its split is a
  BudgetSplit, not a question.)
- Details are missing or there are options to pick: ONE form with ALL the questions and one
  submit button, then stop and wait. Same for confirming before you create, change, send or delete.
- Show results as a block, card or chart when it helps. Plain answers, explanations and code: text.
- Use the user's own numbers and wording; never invent data for a card or chart.
- Never draw charts, diagrams or flows as text, ASCII, Mermaid or a code block: build them from components (references/explain-visually.md).

## Writing the block
Everything A2UI goes inside `<a2ui>` and `</a2ui>`; outside them it is shown as text. One short
sentence first (say what you show, not that it "is shown"), then the block; don't repeat in text
what the UI shows. The server checks the
block as it arrives; if it is rejected you get the errors once to fix.
- `root` is assigned a component call: `root = Card(...)`. Never `root = card`.
- Named arguments use `=`: `BudgetSplit(100000, parts, title="Budget")`. A colon is only for keys
  inside {maps}: `{label: "Rent", percent: 40}`. (`title: "Budget"` is a syntax error.)
- A Button's child is a component: `Button(Text("Plan my trip"), "primary", Event(...))`.
- Components of any catalog share a surface: a Card may hold a VegaChart, a block and a shortcut. Just write them.
- A Modal draws its own trigger: list the Modal in the Column, not the trigger Button as well.
- Headings are Markdown in Text (`"### Trip details"`); Text variants are only body and caption.
  Tables are Markdown tables in one Text.
- Bind every input to `$/form/<field>`, set defaults with `$/form/<field> = ...`, and pass every
  field in the submit button's Event context.

- Want the user's current inputs on later turns, without a submit button? Create the surface with
  `surface("<id>", sendDataModel=true)`: its data model then comes with each following message
  (`a2ui_surface_data_models` in your context; newer than anything you wrote). Only for forms.

## Chat blocks: live cards
Each recalculates in the browser and sends its own events. Put the block first in
`root = Column([...])` with a Suggestions under it (2-4 tap-to-reply follow-ups, references/block-suggestions.md;
a tap sends `say` with the block's live values, answer from those):

<a2ui>
surface("sip_plan")
root = Column([calc, next])
calc = GrowthCalculator(10000, 12, 15)
next = Suggestions("Want me to compare 20 years, or add inflation?", ["Make it 20 years", "Add inflation", "Save this plan"])
</a2ui>

## Earlier surfaces
Earlier surfaces stay in the chat where they were shown; leave them there.
- Change one in place: `surface("<its id>", update=true)`, then only what changes: new data
  (`$/form/days = ["3"]`) or a component under the same name (`calc = GrowthCalculator(10000, 12, 20)`).
  Every component it has must stay reachable from root.
- Something new or a different layout: a new surface with a new id. Don't delete the old one.
- Delete only when the user asks: `deleteSurface("<id>")` alone in its block.

## After a click
A message starting "User action:" is the user's answer from a surface: act on it now (answer,
plan or call a tool) and don't show the same form again.
