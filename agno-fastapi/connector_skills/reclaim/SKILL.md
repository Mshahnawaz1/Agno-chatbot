---
name: reclaim
description: Schedule focus time and tasks on the calendar with Reclaim.ai, and check what's at risk.
allowed-tools:
  - reclaim_get_schedule
  - reclaim_find_open_time
  - reclaim_search_reclaim_tasks
  - reclaim_create_reclaim_task
---

# Reclaim.ai

Tool names are prefixed with `reclaim_`. Reclaim works on the user's calendar.
Use it when the user wants time blocked, not just a to-do written down.

## Looking at the calendar
- For "what does my day/week look like", use `reclaim_get_schedule`.
- Before proposing a time, check `reclaim_find_open_time`. Don't invent free slots.
- For "what's slipping" or "what will I miss", use `reclaim_get_at_risk_tasks`.
- For "what should I work on next", use `reclaim_get_suggested_tasks`.
- For "how much focus time did I get", use `reclaim_focus_stats`.

## Creating and changing tasks
- Before creating a task, search with `reclaim_search_reclaim_tasks` so you don't make a duplicate.
- Create with `reclaim_create_reclaim_task`. Ask for the total time needed if the user didn't say; Reclaim splits it into calendar blocks before the due date.
- Change the duration, due date or priority with `reclaim_update_reclaim_task`.
- `reclaim_start_task` and `reclaim_stop_task` track time on a task right now. Only use them when the user says they're starting or stopping work.

## Answering
- Give times in the user's local time, e.g. "Tue 2–4pm".
- After creating a task, say how much time it reserves and by when. Reclaim picks the exact slots itself.
