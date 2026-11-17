---
name: a2ui
description: Interactive UI in replies. Load it for EVERY reply that shows UI (also when earlier turns did) and before any reply that asks the user to choose, pick, confirm or fill in details, offers options, or shows a chart, card or calculation; never ask such questions as plain text. Has ready-made live blocks - investment/SIP growth, budget split, quadratic, chart switcher, rank list, reminder, and approval cards for messages, emails and orders - prefer them over computing results yourself.
metadata:
  preload: references/grammar.md references/components.md templates/form.md
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
1. This skill came with grammar.md, components.md and templates/form.md. For anything else in
   the table below (a block, a chart, more checks), load it in ONE more call:
   `get_skill_instructions("a2ui", paths=["references/block-growth.md", ...])`.
   Use only components named in these files; never guess a component.
2. Write the block, starting from the template.
3. Check it: `get_skill_script("a2ui", "check.py", args=["<the whole block, with <a2ui> tags>"])`.
   It compiles the block against this chat's real surfaces. On errors, fix and check again
   (at most twice). Send the block only once it prints OK, unchanged.
4. Reply: one short sentence, then the block. Don't repeat in text what the UI shows.

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
