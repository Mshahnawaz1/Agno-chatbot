---
name: ui-forms
description: Asks the user for details, a choice or approval with a form. ALWAYS load it BEFORE replying when you would otherwise ask the user anything (a question, preferences, details, options, confirmation, a date or amount), e.g. "help me plan ...", "which one should I ..."; use it instead of plain-text questions. Load it again for every reply that shows a form, also when earlier turns did.
metadata:
  preload: references/grammar.md references/rules.md references/components.md templates/form.md
---

# Forms in chat

## When to use
Use a form whenever your reply would otherwise:
- ask a question with a known set of answers (preferences, type, yes/no)
- ask for two or more details (destination, dates, budget, group size)
- offer options, recommendations or plans to pick from
- need confirmation before you create, change, send or delete something
- need a date, time, number, amount or rating

Not for plain answers, explanations or code. For a ready-made calculator or an approval card, use
`ui-blocks`; for showing results or a chart, use `ui-display`.

## Workflow
1. Put ALL the questions in ONE form with one submit button, starting from `templates/form.md`
   (already loaded). Rename the surface id, fields and event; keep the shape.
2. Reply with one sentence and the block (see rules.md). Stop and wait.
3. Input checks beyond `?required` (email, regex, length) and number formatting:
   `get_skill_instructions("ui-forms", paths=["references/functions.md"])`.

## Files
| File | What it holds |
|---|---|
| references/grammar.md | Express syntax: bindings, events, checks (loaded) |
| references/rules.md | output rules, updating and deleting surfaces (loaded) |
| references/components.md | signatures of the form components (loaded) |
| templates/form.md | a complete form (loaded) |
| references/functions.md | all input checks and formatting functions |
| templates/update.md | changing or removing a form from an earlier turn |
