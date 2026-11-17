---
name: task-routing
description: Decide where to create a task when both Todoist and Reclaim are connected. Use before creating any task.
---

# Task routing

Create tasks in **Todoist** with `todoist_add-tasks`. Todoist is the user's task list.

Use **Reclaim** (`reclaim_create_reclaim_task`) only when the user asks for
time on their calendar, e.g. "block 2 hours for X", "schedule time to work on X",
or names Reclaim directly.

If only one of the two is connected, use that one.
