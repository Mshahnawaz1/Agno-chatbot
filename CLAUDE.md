# CLAUDE.md

## Repository
- `learn_agno/`: early Agno experiments.
- `agno-fastapi/`: the main app. FastAPI + Agno agent (`app/`), Vite/React/Tailwind v4
  frontend (`frontend/`). The agent's A2UI prompt is `app/a2ui.py`; the frontend renderer is
  `frontend/src/features/chat/a2ui/`.
- `a2ui-kb/`: local knowledge base about A2UI (research notes, one topic per file).
- `a2ui-poc/`: standalone A2UI proof of concept (minimal agent + renderer), separate from the app.
- `TASK_IN_HAND.md`: the current plan and its status. Read it first and keep it up to date.

## Current work: A2UI, research first
Work through `TASK_IN_HAND.md` in order:
1. Learn the fundamentals of A2UI and how it pairs with agent frameworks (Agno, LangGraph, ...).
2. Document how it works end to end: what the agent writes, what is shown, and how the
   frontend renders it (generative elements, catalogs, renderer internals).
3. Find where catalogs, templates and skills live, i.e. how an agent knows what it can create.
4. Write all of it into `a2ui-kb/`.
5. Build a POC in `a2ui-poc/`: an agent with only A2UI capability, tested end to end against
   the scenarios in the A2UI docs, with results recorded.
6. Show the validated POC in a UI to the user.
7. Only after the user signs off: integrate into `agno-fastapi/`.

Rules for this work:
- Don't change `agno-fastapi/` for A2UI until Phase 6 is approved.
- Back every KB claim with a source: a file path in node_modules/a repo, or a doc URL.
- Mark each task in `TASK_IN_HAND.md` as it starts and finishes.
- Never write API keys into files; read them from the environment (`GEMINI_API_KEY`,
  `GROQ_API_KEY`, ...).

## Conventions
- Frontend: `npm` in `agno-fastapi/frontend`; check with `npx tsc -b`, `npx eslint .`, `npm run build`.
- Python: `uv` at the repo root.
- shadcn CLI here resolves the utils alias wrongly: after `npx shadcn add`, replace
  `from "cn"` with `from "@/lib/utils"` and `npm uninstall cn`.
