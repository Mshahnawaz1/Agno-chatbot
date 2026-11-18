---
name: ui-display
description: Shows results as a card, table, chart, image, video, audio or dialog. Use for weather, schedules, comparisons, custom charts and media.
metadata:
  preload: references/grammar.md references/rules.md references/components.md
---

# Showing results in chat

Show results as a card instead of long text when it helps: weather, schedule, comparison, a list
of options. No UI for plain answers, explanations or code.

## Workflow
1. Build the card from the components loaded here (`references/components.md`). Tables are
   Markdown tables inside one Text.
2. A chart, graph, plot or custom live formula (a loan, a custom curve):
   `get_skill_instructions("ui-display", paths=["references/chart.md"])`. If a ready-made block
   fits (growth, budget, quadratic, one restyled series), use `ui-blocks` instead.
3. A video, an audio clip or a pop-up dialog (Modal):
   `get_skill_instructions("ui-display", paths=["references/components-media.md"])`.
   Use a URL the user gave you or a well-known public one; never invent URLs.
4. Check the block (see rules.md), then reply with one sentence and the block.

## Files
| File | What it holds |
|---|---|
| references/grammar.md | Express syntax: bindings, events, templates (loaded) |
| references/rules.md | output rules, check step, updating and deleting surfaces (loaded) |
| references/components.md | text, image, icon, row, column, list, card, tabs, divider, button (loaded) |
| references/chart.md | VegaChart: any chart or live formula |
| references/components-media.md | Video, AudioPlayer, Modal |
| references/functions.md | formatting numbers, currency and dates |
| templates/update.md | changing or removing a card from an earlier turn |
