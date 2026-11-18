---
name: microsoft-office
description: 'Use for Word (.docx): create reports/letters, read, edit, fill templates, tracked changes, comments.'
license: MIT
metadata:
  author: Nous Research
  version: "2.0.0"
  tags: "office word docx documents"
---

# Microsoft Office Skill (Word only)

Adapted from hermes-agent (MIT, Nous Research). Only the Word (`.docx`) part is kept here; PowerPoint and
Excel helpers are not installed.

Create, read, edit, and template Word files offline with small Python CLIs built on python-docx. Office
itself is never needed. It does not open legacy `.doc` files and does not render pages.

## Runtime here

Tool mapping (hermes -> this app): `write_file` -> `save_file`, `patch` -> `replace_file_chunk`,
`read_file` -> `read_file`; `terminal` / `"$PY" scripts/x.py args` ->
`run_skill_script(skill="microsoft-office", script="x.py", args=["..."])`. Scripts run with the user's workspace as
the working directory and the app's Python (libraries are installed); all paths are workspace-relative
(no absolute paths, no `..`). Not available: the `hermes` CLI, `vision_analyze`, `browser_exec`, a
browser or `skill_view` (use `get_skill_instructions(skill, paths=[...])` for files). Where this text
says `skill_view`/`vision_analyze`/`"$PY"`, use the mapping above or skip the step.

## When to Use

Read `references/word.md` first (reports, letters, contracts, `{{token}}` templates, tracked changes,
comments); `references/revisions-and-comments.md` has the deeper review-markup notes.

- Not for `.doc`/`.odt`, or WYSIWYG layout work. Not for `.pptx`/`.xlsx` (no helpers here).

## Prerequisites

Word only here. `python-docx` is already installed; there is no environment to set up. Ignore any `$PY` instruction below. LibreOffice (`soffice`) is not available.

## How to Run

Every helper lives in `scripts/`, is an argparse CLI with `--help`, prints JSON to stdout, and exits
non-zero on failure. Author JSON specs with `save_file`; read results from stdout or with `read_file`.

```bash
python scripts/docx_create.py spec.json out.docx    # run_skill_script(skill="microsoft-office", script="docx_create.py", args=["spec.json","out.docx"])
```

## Quick Reference

| Task | Helper |
| --- | --- |
| Create from JSON spec | `docx_create.py` |
| Read back | `docx_read.py --text/--structure` |
| Edit | `docx_edit.py` |
| Fill a template | `docx_template.py` |
| Review / check | `docx_revisions.py`, `docx_comments.py`, `docx_validate.py` |

`references/word.md` has the full flag table.

## Procedure

1. Load `references/word.md`.
2. Create, edit, or read with the helpers; pass an output path to keep the original whenever the helper
   supports one.
3. Verify the result as the reference's Verification section says, then give the user the exact output path.

## Pitfalls

- **Never unzip-and-edit the XML.** `.docx` is a zip package; raw text substitution corrupts it. Edit
  through the helpers and use `replace_file_chunk`/`save_file` only for JSON inputs.
- **Text is split into runs.** The replace helpers merge equal-format runs first, but a match across
  differently formatted runs takes the first run's formatting.
- **Nothing computes fields.** Word TOC/page fields are filled in by Word on open.
- **No PDF conversion here** (`soffice` is not available): say so rather than approximating.
- **Encoding.** Write specs as UTF-8; the helpers read UTF-8 explicitly.
- Format-specific traps are in the reference.

## Verification

- Re-read every output with `docx_read.py` and check the expected content is there and the old content is gone.
- `docx_validate.py out.docx` exits 0 after revision, comment, or field surgery.
