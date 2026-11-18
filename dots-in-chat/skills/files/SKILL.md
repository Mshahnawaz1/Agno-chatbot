---
name: files
description: Use when the user wants a document to keep, download or send (Word/.docx, PDF, HTML page, e.g. report, letter, resume, web page), or to read or change a file in their workspace. Not for short answers or live cards (ui-display).
---

# Files: documents the user keeps

The chat has a preview panel: every file you create or change opens there, with a Download
button. Files live in the user's workspace (paths are relative, e.g. `q3-report.md`).

## File or chat?
Make a file when the user asks for one (a "document", "Word doc", "PDF", "page", "report",
"resume", "letter", "something to print/send/download"), or when the answer is a long artifact
meant to be kept (over ~40 lines). Answer in chat for explanations, short lists, code snippets,
quick drafts the user will paste elsewhere, and anything conversational. Do not ask "should I
make a file?"; decide.

Pick the format:
| User wants | Format |
|---|---|
| named a format | that format |
| a document, report, letter, resume to edit further (no format named) | `.docx` |
| printable / final / "to send" / fixed layout | `.pdf` |
| a web page, landing page, styled one-pager, visual dashboard page, newsletter | `.html` |

## Workflow
Tools: `save_file(contents, file_name)`, `read_file(file_name)`,
`replace_file_chunk(file_name, start_line, end_line, chunk)`, `list_files()`, `delete_file(file_name)`,
`build_docx(source)`, `import_docx(path)`, `build_pdf(source)`, `read_pdf(path)`.
A tool result starting with "Error" means it failed: fix the cause and retry once, then tell
the user in one line.

**Word (.docx)**: `save_file` the content as `name.md` (Markdown below), then `build_docx("name.md")`
-> `name.docx`.
**PDF**: `save_file` as `name.md`, then `build_pdf("name.md")` -> `name.pdf` (A4, clean built-in
styling; you do not style it).
**HTML**: `save_file` the full document straight to `name.html` (no build step). Start from a
template (see "HTML pages").

### Editing (any later turn)
1. Find the file: `list_files()` if unsure of the name. For a `.docx`/`.pdf`, edit its `.md`
   source (same name). No `.md` next to a `.docx`? `import_docx("name.docx")` creates it.
   No `.md` next to a `.pdf`? `read_pdf("name.pdf")`, rewrite the text as clean Markdown with
   `save_file("name.md")`, then rebuild (layout, images and fonts of the original are lost: say so).
2. `read_file` the source. Lines are numbered from **0**; `end_line` is **inclusive**.
   `replace_file_chunk("r.md", 4, 6, "new text")` replaces lines 4, 5, 6.
   To insert after line N without removing it: replace N..N with "line N\nnew lines".
3. Edit with `replace_file_chunk`, never by re-saving the whole file. Several edits in one
   turn: apply them bottom-up (highest line first) so earlier line numbers stay valid, or
   `read_file` again between edits. Use `save_file` for the whole file only when the user asks
   for a full rewrite or most lines change.
4. Rebuild: after any change to a `.md` that has a `.docx` and/or `.pdf` twin, call
   `build_docx` and/or `build_pdf` again (each twin that exists). `.html` needs no rebuild.

### Naming and overwriting
- lowercase-kebab-case, short and specific: `q3-sales-report.md`, `jane-doe-resume.html`.
  No spaces, no dates unless they matter, no `final`/`new`. Keep files at the top level.
- `save_file` overwrites silently. Before creating, `list_files()` if a clash is plausible: if a
  file with that name is a different document, pick another name (`-2`); if it is the same
  document the user is talking about, edit it instead.
- `import_docx` overwrites the `.md` next to the `.docx`; only call it when that `.md` is missing
  or the user uploaded a new `.docx`.
- Delete only files you created, and only when the user asks.

## Markdown for .docx and .pdf
Supported: `#`, `##`, `###` headings; paragraphs; `**bold**`, `*italic*`, `` `code` ``;
bullet and numbered lists (one nested level); pipe tables with a header row; `[text](url)`
links; `> quotes`; fenced code blocks (monospace).
Degrades:
- docx turns a line break inside a paragraph into a hard break: write **each paragraph on one
  line**, separated by a blank line.
- docx maps `####`+ to level 3; `---` rules are dropped in docx (kept in pdf).
- Images are dropped (both). Raw HTML shows as literal text. `~~strike~~`, task lists `- [ ]`,
  footnotes, emoji shortcodes and math are not converted (they show as typed).
- Lists nested deeper than one level are flattened. Links in docx become `text (url)`.
- Tables: no merged cells or widths; keep them to about 6 columns and short cell text.

## Document quality
- Open with one `#` title, then a 1-3 sentence purpose or summary. Use `##` for sections and
  `###` sparingly; never skip a level. Headings say what the section holds ("Risks and
  mitigations", not "Section 3").
- Real content only: no `[Your Name]`, `Lorem ipsum`, `TBD`, `XX%` or invented facts and numbers.
  If a key detail is missing (name, dates, figures), either ask once before writing or write
  around it and list what to fill in, in your chat line. Use details the user gave verbatim.
- Concise: short paragraphs (2-4 sentences), lists for parallel items, a table for comparisons
  or anything with 3+ attributes. Cut filler intros, repetition and closing summaries that
  restate the body.
- Fit the genre: a letter has date, greeting, body, sign-off; a resume has name + contact line,
  summary, experience (role, org, dates, 2-4 impact bullets with numbers), skills, education;
  a report has summary, findings, recommendations or next steps.
- Consistent tense, number and date formats, and parallel list grammar.
- Match the language the user writes in.

## HTML pages
Load a starting point with `get_skill_instructions("files", paths=["templates/html-report.md"])`
(or `html-resume.md`, `html-dashboard.md`); adapt it, don't paste it unchanged. The preview runs
with a strict policy (no scripts, no network), so:
- One self-contained file: `<!doctype html>`, `<html lang="...">`, `<meta charset="utf-8">`,
  `<meta name="viewport" content="width=device-width, initial-scale=1">`, a `<title>`, and ONE
  `<style>` block in `<head>`. No `style=""` sprawl; reuse classes.
- No JavaScript (no `<script>`, no `on*=` attributes): it will not run. Interactivity only through
  HTML/CSS (`<details>`, `:hover`, anchors).
- No external URLs of any kind: no web fonts, CDNs, `<link rel="stylesheet">`, remote images or
  `@import`; they are blocked and leave holes. Fonts: a system stack
  (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`). Graphics: inline `<svg>` or CSS;
  images only as small `data:` URIs.
- Responsive: fluid widths, `max-width` container (~800px for documents), CSS grid/flex with
  `auto-fit`/`minmax` or a breakpoint; nothing wider than 360px fixed; tables in a wrapper with
  `overflow-x: auto`.
- Print-friendly: `@media print` removes shadows and backgrounds, sets black text, and uses
  `break-inside: avoid` on cards and table rows.
- Accessible: semantic tags (`header`, `main`, `section`, `h1`-`h3` in order, `table` with `th`),
  text contrast at least 4.5:1 (dark text on light, no grey-on-grey), color never the only
  signal, `alt` on images, `aria-label` or `<title>` on meaningful SVG.
- Keep one element per line and the CSS short (one rule per line) so later edits with
  `replace_file_chunk` touch few lines. Define colors once as CSS variables in `:root`.

## After creating or editing: the chat reply
One line: what you did and what the file holds, naming the file the user sees (the `.docx`,
`.pdf` or `.html`, not the `.md` source). E.g. "Created `q3-sales-report.docx`: a 2-page summary
with a regional table and three recommendations." / "Updated `jane-doe-resume.html`: new title
and a Skills section." Add a second line only for what the user must fill in or a known loss
(e.g. after editing a PDF). Never paste the file's content into chat, and never write download
links; the panel shows the file.

## Limits
- `read_pdf` returns text only (per page): no images, layout or table structure; scanned PDFs
  return "(no extractable text)". Long PDFs are truncated.
- Editing a PDF is always a lossy rebuild from Markdown with the default styling.
- docx/pdf styling is fixed (fonts, colors, margins); for a designed look, offer `.html`.
- Files over 2 MB of text are refused; keep documents focused.
