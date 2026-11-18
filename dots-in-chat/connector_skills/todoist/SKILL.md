---
name: todoist
description: Adds, finds, reschedules and completes Todoist tasks. Use for the user's to-do list, tasks and due dates.
allowed-tools:
  - todoist_find-tasks
  - todoist_find-tasks-by-date
  - todoist_add-tasks
  - todoist_reschedule-tasks
---

# Todoist

Tool names are prefixed with `todoist_`.

## Before acting
- For "what's on my plate", start with `todoist_get-overview`.
- For a specific day or range ("today", "this week", "overdue"), use `todoist_find-tasks-by-date`.
- Before adding a task, check it doesn't already exist with `todoist_find-tasks`.
- To put a task in a project, look up the project id with `todoist_find-projects`. Never guess ids.

## Adding tasks
- Use `todoist_add-tasks`. Add several tasks in one call, not one call each.
- Keep the user's wording for the title. Put extra detail in the description.
- Give dates in natural language ("tomorrow 9am", "every Monday"). Todoist uses the user's timezone.
- Only set a priority or duration when the user asks for one.

## Changing tasks
- To move a task to another date or time, use `todoist_reschedule-tasks`.
- To mark tasks done, use `todoist_complete-tasks`. Completing a recurring task moves it to its next occurrence; it doesn't end the series.
- If more than one task matches what the user said, list the matches and ask which one before changing anything.

## Answering
- Confirm what changed in one line per task, with its new due date.
- Don't paste task ids to the user.
