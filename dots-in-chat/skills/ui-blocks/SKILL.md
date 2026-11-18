---
name: ui-blocks
description: Shows ready-made live cards (growth/SIP, budget, quadratic, charts, ranklist, reminder, message, batch, draftdiff, order). Use when a request matches one.
metadata:
  preload: references/grammar.md references/rules.md templates/block-card.md
---

# Live chat blocks

Each block keeps its own live state in the browser and sends its own events. Pick the one that
matches the request, then load its signature in your FIRST call, naming the file:
`get_skill_instructions("ui-blocks", paths=["references/block-<name>.md"])`
(load two only when one reply needs two blocks).

| Name | Block | Use for |
|---|---|---|
| growth | GrowthCalculator | SIP or monthly investment "what if" |
| budget | BudgetSplit | split a salary or a 50-30-20 budget, draggable ring |
| quadratic | QuadraticExplorer | explore y = ax² + bx + c |
| charts | ChartSwitcher | one series of up to ~12 points that the user restyles (bar, line, pie...) |
| chartgallery | ChartGallery | a menu of chart types to pick from |
| ranklist | RankList | the user drags 3-7 items into priority order |
| reminder | ReminderPicker | set a reminder |
| message | MessageApproval | a message for one person, approved before sending |
| batch | BatchSend | follow-ups for several people at once |
| draftdiff | DraftDiff | an email draft to approve |
| order | OrderReview | a basket to approve before paying |
| suggestions | Suggestions | 2-4 tap-to-reply follow-ups under a block |

## Workflow
1. Start from `templates/block-card.md`: the block first in
   `root = Column([...])`, a Suggestions under it.
2. Fill the block's arguments from the user's numbers; don't compute results yourself.
3. Reply with one sentence and the block (see rules.md).

No block fits? A form is `ui-forms`; results, tables, other charts are `ui-display`.
