---
name: task-routing
description: Picks Todoist or Reclaim for a new task when both are connected. Use before creating any task.
---

# Task routing

Create tasks in **Todoist** with `todoist_add-tasks`. Todoist is the user's task list.

Use **Reclaim** (`reclaim_create_reclaim_task`) only when the user asks for
time on their calendar, e.g. "block 2 hours for X", "schedule time to work on X",
or names Reclaim directly.

If only one of the two is connected, use that one.
