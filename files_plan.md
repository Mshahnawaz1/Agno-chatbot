# files_plan.md: agent file workspace (v1: .docx create / edit / preview)

Branch: `feat/file-tools-docx` (from `main`). Work tracker: `files_todo.md`.

## Goal
The agent can create, read and update files in a workspace, and the chat shows the file in a
preview panel to the right of the chat (like ChatGPT canvas). **v1 supports `.docx` only.**
Later formats (.xlsx, .html, .pdf) reuse the same panel, endpoints and events; only a new
"format adapter" is added per type (see "Extending").

## Key constraint: FileTools is text-only
Agno `FileTools` (`agno.tools.file`) reads and writes `str`. A `.docx` is a zip, so the model
cannot write it through `save_file`. Design:

- **Source of truth = a Markdown file** (`report.md`) that the agent edits with the stock
  `FileTools` (`save_file`, `read_file`, `replace_file_chunk`, `list_files`, `search_files`,
  `delete_file`). No custom editing tools; this is the existing tool the task asks for.
- **`.docx` is a derived output.** One thin extra tool, `build_docx(source, output=None)`,
  converts `<source>.md` to `<source>.docx` (python-docx). The agent calls it after
  `save_file` / `replace_file_chunk`.
- **Preview** = `.docx` rendered to sanitized HTML (mammoth) and shown in a sandboxed iframe.
  Download serves the real `.docx`.
- To *edit an existing .docx* (e.g. the user uploads one later): tool `import_docx(path)` writes
  a `.md` next to it (mammoth to markdown), then the normal edit + build loop applies.
  (Included in v1 backend; no upload UI in v1.)

Markdown subset supported by the converter: `#`..`###` headings, paragraphs, **bold**, *italic*,
`code`, bullet and numbered lists (one nesting level), tables (pipe), links (text kept, URL
appended), block quotes. Anything else degrades to plain paragraphs and never raises.

## Architecture

```
user msg -> agent (FileTools + build_docx) -> files under data/workspace/<user_id>/
                        |
              tool_call_completed(save_file | replace_file_chunk | build_docx | delete_file)
                        |
   chat.py emits SSE  event: file   {path, kind, action}
                        |
   frontend: opens/refreshes preview panel -> GET /files/preview?path=  (HTML)
                                            -> GET /files/download?path= (.docx)
```

### Backend (dots-in-chat/app)
- `config.py`: `agent_workspace_dir` already added (uncommitted in working tree; keep).
- `agent/workspace.py` (new): `workspace_for(user_id) -> Path` (creates `<root>/<user_id>/`),
  `safe_path(user_id, rel) -> Path` (rejects absolute paths, `..`, symlink escapes, hidden names),
  extension allow-list `{".md", ".docx"}` for preview/download.
- `agent/docx_tools.py` (new): `md_to_docx(md_text) -> bytes`, `docx_to_md(bytes) -> str`,
  `docx_to_html(path) -> str` (mammoth, then sanitised with `nh3`), and a `DocxTools(Toolkit)` with
  `build_docx`, `import_docx`. Pure functions are unit-tested; the Toolkit is a thin wrapper.
- `agent/core.py`: in `agent_tools(run_context)` add, per user, `FileTools(base_dir=workspace_for(
  run_context.user_id), <flags from the task>)` and `DocxTools(base_dir=...)`. The module-level
  `file_tools` becomes a factory. Add an INSTRUCTIONS entry: write long content to a file, say what
  you created in one line, edit with `replace_file_chunk` rather than rewriting, always call
  `build_docx` after editing a `.md` that has a `.docx` twin.
  NOTE: the working tree's `core.py` line 38 has a half-written edit
  (`... + await user_connector_tools(run_context) + `); the backend work completes it with the
  file tools and does not touch the rest of the user's WIP.
- `routers/files.py` (new, `prefix="/files"`, auth via `CurrentUser`):
  - `GET /files` -> `[{path, name, size, modified, kind}]`
  - `GET /files/preview?path=` -> `{path, kind: "docx"|"md", html, version}`; `.md` with a `.docx`
    twin previews the twin; `.md` alone is rendered to HTML.
  - `GET /files/download?path=` -> bytes with `Content-Disposition: attachment`.
  - 404 missing, 400 path escape, 415 unsupported type. `version` = file mtime_ns as string.
  - Register in `main.py`; add `"files"` to `API_PREFIXES`.
- `routers/chat.py`: on `RunEvent.tool_call_completed` for file tools, yield
  `sse("file", {"path","kind","action": "created|updated|deleted"})`. History re-open: tool calls
  already live in message `metrics.tools`, so the frontend derives chips from there (no new DB
  table in v1).
- Dependencies: `python-docx`, `mammoth`, `markdown-it-py`, `nh3` in `requirements.txt` and root
  `pyproject.toml` (`uv add`).

### Frontend (dots-in-chat/frontend/src)
- `lib/sse.ts` / `chatStore.ts` / `ChatStreamProvider.tsx`: handle `file` event; turns get
  `files: FileRef[]`.
- `lib/api.ts` + `lib/types.ts`: `listFiles`, `getFilePreview`, download via authenticated blob
  fetch (never a token in a URL).
- `features/files/` (new): `FilePanel.tsx` (filename header, Download, close; body = sandboxed
  `<iframe sandbox srcDoc>` with page styling), `FileChip.tsx` (card under the assistant message:
  name + Created/Updated, click opens panel), `useFilePanel.ts` (react-query keyed by path+version).
- `ChatPage.tsx`: two-column layout. Closed = current layout untouched. Open on `lg+`: chat left
  (min 380px), panel right (~45%). Below `lg`: full-screen overlay with back button. A new file
  auto-opens the panel; an updated file refreshes it. Use existing Tailwind v4 tokens/components.
- History: assistant messages whose `metrics.tools` hold file tool calls render `FileChip`s.

## API contract (shared; do not drift)
SSE on `/chat/stream`: `event: file` data
`{"path":"report.docx","kind":"docx","action":"created"|"updated"|"deleted"}`
(path relative to the user's workspace, forward slashes).
`GET /files/preview?path=report.docx` ->
`{"path":"report.docx","kind":"docx","html":"<...>","version":"1731900000000000000"}`.

## Security
- Per-user directory; `safe_path` is the only resolver for the HTTP layer; FileTools adds its own
  base_dir confinement. Tests cover `..`, absolute paths, symlinks, other users' dirs.
- Preview HTML sanitised server-side (`nh3`) AND rendered in an iframe with `sandbox=""`.
- Size caps: markdown writes <= 2 MB, `.docx` preview <= 10 MB.
- `delete_file` enabled per the task; the agent is told to delete only files it created.

## Testing (definition of done for v1)
- Python: unit tests for `md_to_docx` (read back with python-docx: headings, bold, list, table),
  `safe_path` escapes, `/files` endpoints (auth, 404, 400, 415), event emission. `uv run pytest`.
- Frontend: `npx tsc -b`, `npx eslint .`, `npm run build` clean.
- E2E in browser: "write a one-page project brief as a Word doc" -> panel opens with preview;
  "change the title and add a risks section" -> same panel refreshes; downloaded `.docx` opens
  with the edit. Results recorded in `files_todo.md`.

## Extending (not in v1)
One adapter per format `{ext, to_preview_html, tools}`: `.html` (sandboxed direct preview), `.pdf`
(iframe/pdf.js), `.xlsx` (openpyxl, HTML table preview). Panel, endpoints and SSE event are
format-agnostic via `kind`.

## Open questions (defaults chosen; tell me to change)
1. Markdown as the docx source (default) vs. editing docx XML. Markdown is far more reliable for
   LLMs; fidelity is limited to the supported subset.
2. Workspace per user (default) vs. per chat session.
3. The user's uncommitted WIP in `core.py` / `config.py` / `agent/__init__.py` is not committed
   wholesale; only lines this feature needs are staged.
