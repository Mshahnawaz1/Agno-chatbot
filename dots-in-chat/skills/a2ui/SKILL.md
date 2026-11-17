---
name: a2ui
description: Interactive UI in replies. ALWAYS load it BEFORE replying when you would otherwise ask the user anything (a question, preferences, details, options, confirmation, a date or amount), e.g. "help me plan ...", "which one should I ...", or when you show a chart, card or calculation; plain-text questions are not allowed. Load it again for every reply that shows UI, also when earlier turns did. Has ready-made live blocks - investment/SIP growth, budget split, quadratic, chart switcher, rank list, reminder, and approval cards for messages, emails and orders - prefer them over computing results yourself.
metadata:
  preload: references/grammar.md
  default_paths: references/components.md templates/form.md
  pairs: references/block-=templates/block-card.md
---

# Interactive UI (A2UI Express)

## When to show UI
Use a form whenever your reply would otherwise:
- ask a question with a known set of answers (preferences, type, yes/no)
- ask for two or more details (destination, dates, budget, group size)
- offer options, recommendations or plans to pick from
- need confirmation before you create, change, send or delete something
- need a date, time, number, amount or rating
Put ALL the questions in ONE form with one submit button, then stop and wait.
You MAY show results as a card (weather, schedule, comparison) or a chart. No UI for plain
answers, explanations or code.

## Workflow
1. Load in ONE call, naming what the reply needs (the index lists the files). Grammar always
   comes with it.
   - A chat block below (budget, SIP, chart...): `get_skill_instructions("a2ui",
     paths=["references/block-<name>.md"])` (the block template comes with it)
   - A form or custom card: no paths (you get the basic components and the form template).
   - A chart: add "references/chart.md". Input checks or number formats: "references/functions.md".
   Use only components named in what you loaded; never guess a component.
2. Write the block, starting from the template. The server checks it as it arrives; if it is
   rejected you get the errors once to fix.
3. Reply: one short sentence, then the block. Don't repeat in text what the UI shows.

| File | Load when |
|---|---|
| references/grammar.md | always (syntax, bindings, events, templates) |
| references/components.md | basic layout, text, buttons and inputs (forms, cards) |
| references/functions.md | input checks beyond ?required, or formatting numbers/dates |
| references/chart.md | any chart, graph, plot or custom live formula (VegaChart) |
| references/block-<name>.md | a chat block below |
| templates/form.md | a form that asks for details |
| templates/block-card.md | a chat block with follow-up Suggestions |
| templates/update.md | changing or removing a surface from an earlier turn |

## Chat blocks: ready-made live cards (prefer them over building the same thing)
Each recalculates in the browser and sends its own events. Put one first in
`root = Column([...])`, with a Suggestions under it.
- growth: GrowthCalculator: SIP / monthly investment "what if"
- budget: BudgetSplit: split a salary or 50-30-20 budget, draggable ring
- quadratic: QuadraticExplorer: explore y = ax² + bx + c
- charts: ChartSwitcher: one series of up to ~12 points, user restyles it
- chartgallery: ChartGallery: menu of chart types to pick from
- ranklist: RankList: user drags 3-7 items into priority order
- reminder: ReminderPicker: set a reminder
- message: MessageApproval: a message for one person, approve before sending
- batch: BatchSend: follow-ups for several people at once
- draftdiff: DraftDiff: an email draft to approve
- order: OrderReview: a basket to approve before paying
- suggestions: Suggestions: 2-4 tap-to-reply follow-ups under a block

## Rules
- Everything A2UI goes inside `<a2ui>` and `</a2ui>`; outside them it is shown as text.
- `root` is assigned a component call: `root = Card(...)`. Never `root = card`.
- A Button's child is a component: `Button(Text("Plan my trip"), "primary", Event(...))`.
- Headings are Markdown in Text (`"### Trip details"`); Text variants are only body and caption.
  Tables are Markdown tables in one Text.
- Bind every input to `$/form/<field>`, set defaults with `$/form/<field> = ...`, and pass every
  field in the submit button's Event context.
- Never draw charts as text or ASCII.

## Surfaces across turns
Earlier surfaces stay in the chat where they were shown; leave them there.
- Change one in place: `surface("<its id>", update=true)`, then only what changes (new data, or
  components that keep their names). Every component it has must stay reachable from root.
- Something new or a different layout: a new surface with a new id. Don't delete the old one.
- Delete only when the user asks to remove it: `deleteSurface("<id>")` alone in its block.

## After a click
A message starting "User action:" is the user's answer from a surface: act on it now (answer,
plan or call a tool) and don't show the same form again.
