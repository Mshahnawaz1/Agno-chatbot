# Hermes-agent file skills: how it works and how we use it

Source: `External-Repos/hermes-agent` (MIT, Nous Research). Copied skills keep their LICENSE and
`author: Nous Research`; scripts, references and templates are byte-identical to the originals.

## How hermes edits files
1. **Generic text tools** (`tools/file_tools.py`): `read_file`, `write_file`, `patch` (find and replace
   with fuzzy matching), `search_files`. Guards live in `file_tools_write_guards.py`: stale-overwrite
   check, sensitive paths, and `_check_binary_document_write`, which refuses plain-text writes to
   .docx/.pdf/office files (a text write cannot produce a valid container and would corrupt it).
2. **Binary documents only through skill scripts.** The model writes a JSON spec with `write_file`, then
   runs a CLI from the skill's `scripts/` with the `terminal` tool. Every script is an argparse CLI,
   prints JSON to stdout and exits non-zero on failure.
   - Word (`skills/productivity/microsoft-office`, python-docx): `docx_create.py spec.json out.docx`
     (blocks: heading, paragraph with runs, bullet/numbered list, table, image, toc, page_break; page
     size, header/footer, page numbers, custom styles), `docx_read.py --text|--structure|--styles|--images`,
     `docx_edit.py replace|set-cell|insert|delete|style|normalize|toc|page-numbers`, `docx_template.py`
     (`{{token}}` fill), `docx_revisions.py` and `docx_comments.py` (tracked changes, comments),
     `docx_validate.py` (package health).
   - PDF (`skills/productivity/pdf`, reportlab + pypdf + pdfplumber): `pdf_create.py spec.json -o out.pdf`,
     `pdf_read.py --text|--tables|--meta|--fields`, `pdf_merge`, `pdf_split` (pages, rotate, compress),
     `pdf_stamp`, `pdf_watermark`, `pdf_fill_form`, `pdf_make_form`, `pdf_secure`, `pdf_meta`,
     `pdf_page_image`; OCR notes in `references/`.
   - Editing an existing file = read it back with the read script, change it with the edit script (never
     unzip-and-edit XML), re-read and validate.
3. **HTML has no script.** It is plain text, so the agent writes it with `write_file` and edits with
   `patch`. Quality comes from skills: `claude-design` (brief, context, variants, verification, avoiding
   generic AI-looking design) and `popular-web-designs` (54 ready design systems in `templates/`).
4. **Skills are loaded on demand** (`skills_list` shows name + description; `skill_view(name)` returns the
   SKILL.md and its linked reference files), so the prompt stays small.

## How we implemented it here
- **Skills** in `dots-in-chat/skills/`: `microsoft-office` (Word only; pptx/xlsx dropped), `pdf`,
  `claude-design`, `popular-web-designs`. Each SKILL.md got an "Adapted from hermes-agent" line and a short
  "Runtime here" section mapping hermes tools to ours (`write_file` to `save_file`, `patch` to
  `replace_file_chunk`, `terminal` to `run_skill_script`) and dropping the hermes-only venv block.
  Frontmatter keys agno rejects (`author`, `version`, `platforms`, `tags`) moved under `metadata:`.
  The skills index lists up to 10 skills inline; a skill with more than 20 extra files (the 54 design
  templates) shows a count, and `get_skill_instructions(name, paths=[...])` still loads any by name.
- **Text tools**: agno `FileTools` (per-user workspace `data/workspace/<user_id>/`), wrapped by
  `WorkspaceFileTools` (`agent/file_guard.py`), which ports the hermes binary-write guard (stricter: it
  always refuses .docx/.pdf/office/image/archive writes) and makes `read_file` on them point to the read
  scripts.
- **No terminal, so `run_skill_script(skill, script, args)`** (`agent/skill_runner.py`):
  - names must match `^[A-Za-z0-9][A-Za-z0-9_-]*$` and resolve to `skills/<skill>/scripts/<script>.py`
    (no traversal, no `_private` helpers); args: at most 64, no absolute paths, `~`, drive letters or `..`;
  - runs `python -I -B -X utf8 agent/skill_sandbox.py` in the workspace with a stripped environment
    (no API keys, JWT or connector secrets), a 60 s timeout (process tree killed) and 4000-char output caps;
  - `skill_sandbox.py` installs a `sys.addaudithook`: file access only in the workspace and the run's temp
    dir (read/write) and the skill dir, Python prefixes and site-packages (read-only); it blocks process
    spawning, network and symlinks. Symlinks are resolved before the check;
  - the workspace is snapshotted before and after; the tool returns
    `{"ok","exit_code","stdout","stderr","changed":[{"path","action","kind"}]}`.
  - **Limits:** an audit hook is defense in depth, not an OS sandbox (C extensions and ctypes can bypass
    it; there are no memory or CPU limits). That is acceptable because the scripts are fixed code we ship
    and the model only controls their arguments and spec files.
- **Preview panel**: `chat.py` turns each `changed` entry (kind docx, pdf, html or md) and each FileTools
  write into an SSE `file` event; the frontend opens or refreshes the panel and rebuilds history chips from
  the stored tool results. Previews: docx via mammoth + nh3 in a sandboxed iframe, html in a sandboxed
  iframe with an injected CSP, pdf as an authenticated blob in the browser viewer.
- **Removed**: our earlier Markdown-to-docx/pdf converters (`DocxTools`, `PdfTools`, `build_docx`,
  `build_pdf`, `import_docx`, `read_pdf`) and the `files` skill.

## Gotchas
- `docx_create.py` does not create parent folders; `pdf_create.py` needs `-o out.pdf`; `docx_read.py` and
  `pdf_read.py` need a mode flag such as `--text`.
- `extract_pymupdf.py` and `extract_marker.py` need pymupdf (AGPL) or marker, which are not installed.
- Never run `uv sync` here: `agno`, `yfinance`, `sqlalchemy`, `groq` and `greenlet` were installed by hand
  and are not in the root `pyproject.toml` (they are now listed in `dots-in-chat/requirements.txt`).
