# files_todo.md

Plan: `files_plan.md`. Branch: `feat/file-tools-docx`. Status: [ ] todo, [~] in progress, [x] done.

## Phase 0: setup
- [x] Branch `feat/file-tools-docx` from `main`
- [x] Write `files_plan.md` and this file
- [x] Add deps (python-docx, mammoth, markdown-it-py, nh3) to requirements.txt + pyproject (uv add)

## Phase 1: backend (agent A: Sonnet)
- [x] `agent/workspace.py`: `workspace_for`, `safe_path`, allow-list
- [x] `agent/docx_tools.py`: `md_to_docx`, `docx_to_md`, `docx_to_html` (+ nh3), `DocxTools` toolkit
- [x] `agent/core.py`: per-user FileTools + DocxTools in `agent_tools`, INSTRUCTIONS entry, fix the
      half-written line 38
- [x] `routers/files.py` (list / preview / download) + register in `main.py` + `API_PREFIXES`
- [x] `routers/chat.py`: emit SSE `file` event from tool_call_completed
- [x] `tests/test_files.py`: converter, safe_path, endpoints, event; `uv run pytest` green

## Phase 2: frontend (agent B: Sonnet)
- [x] Types + api (`listFiles`, `getFilePreview`, blob download)
- [x] `file` SSE event -> store -> `Turn.files`
- [x] `features/files/` FilePanel, FileChip, useFilePanel
- [x] ChatPage two-column layout (+ mobile overlay)
- [x] History: chips from `metrics.tools`
- [x] `npx tsc -b`, `npx eslint .`, `npm run build` clean

## Phase 3: integrate and verify (agent C / me)
- [x] Review both diffs against the API contract (tests/tsc/eslint re-run, see log)
- [ ] Run app; E2E create-then-edit scenario in the browser; record results below
- [ ] Fix findings; final lint/tests

## Phase 4: wrap-up
- [ ] Commit only feature files (not the user's unrelated WIP); no push without asking

## Results log
- Re-run by lead: pytest 57 passed / 1 skipped (symlink test, OS), tsc and eslint clean.
- Converter smoke: md -> docx gives Heading 1, bullets, 1 table; preview HTML renders them and
  escapes a raw `<script>` tag to text (no live script).
- NOT yet done: live E2E with a real model in the browser (needs servers + API key).
- Known limits: save_file has no 2 MB cap (only build_docx/preview enforce it); history chips
  say "Created" even for overwrites; pytest is not a project dev dependency (run with --with).


# v2: .html and .pdf
## Backend (agent D)
- [x] `agent/formats.py` adapter registry; refactor files router + workspace allow-list
- [x] `.html` preview (CSP injected), size cap, SSE kind
- [x] `build_pdf` (xhtml2pdf) + `read_pdf` (pypdf) toolkit, wired per user in core.py
- [x] Tests (converter output is a valid PDF with the text, html CSP, endpoints, events)
## Frontend (agent E)
- [x] `kind` html / pdf in types, fileRefs (tool names, `.html` save_file chips), panel
- [x] PDF preview via authenticated blob + object URL (revoke on change); html via srcDoc
- [x] tsc / eslint / build clean
## Skills (agent F)
- [ ] file skills in `dots-in-chat/skills/` + `core.py` instruction trimmed to a pointer
- [ ] skill validation (name, description rules, loads via agent's skills loader)
## Verify
- [x] Review diffs, run tests/tsc/eslint (63 passed / 1 skipped; tsc, eslint, build clean)
- [ ] Live E2E (html, pdf, edit) if keys available; record results
- [x] Commit + docs/logs.md entry

## v2 results log
- Lead smoke: build_pdf output starts %PDF and read_pdf finds the text; remote image in markdown is
  blocked; html CSP meta injected inside <head>, <style> kept.
- Skills index grew to 470 tokens (guard raised 420 -> 480 for the new `files` skill).
- NOT yet done: live E2E with a real model/browser (html + pdf create and edit, PDF viewer in panel).


# v3: hermes skills (see files_plan.md v3)
- [x] Skills agent: copy + adapt 4 skills, drop `files` skill, INLINE_MAX/budget, validate
- [x] Backend agent: run_skill_script runner + sandbox, remove md converters/toolkits, events, tests, deps
      (skill_runner.py + skill_sandbox.py, file_guard.py, previews.py; pytest 109 passed / 2 skipped)
- [x] Frontend agent: chips from `changed`, drop build_* logic
- [x] Docs: docs/hermes_file_skills.md (how hermes does it + how we adapted)
- [x] Verify: run copied scripts through the runner (create docx/pdf from spec, edit), tests, tsc/eslint
- [x] Commit + logs.md

## Live test results (18 nov 26, real Gemini flash-lite, local server, API + browser)
| step | result |
| --- | --- |
| docx create | OK in 30 s (10 tool calls), heading, bullets, table; `file` event + preview + download OK |
| docx edit | OK (title changed, Risks section added) but the run hit a Gemini 429 mid-way and sent an error event |
| pdf create | content correct, but 25 tool calls / 232 s (several script retries); no table, plain text lines |
| html create | OK, 11 s |
| html edit | PARTIAL: name changed to "Bean Here" but the hero background stayed cream, not brown; model rewrote with read_file + save_file instead of replace_file_chunk |
| xlsx create/edit | OK, 10-17 s; Rent Actual also reads 450 (unclear if the model's own data or an edit slip) |
| pptx create/edit | OK, 11 s / 5 s; title edit applied |
| browser | history chips render, click opens the right-hand panel, pptx and xlsx previews and Download button OK |
Fixed during the run: xlsx preview padded blank columns (read-only mode); now trimmed, test added.
Open: pdf skill efficiency; html edits should use replace_file_chunk and verify; free-tier 429s.
