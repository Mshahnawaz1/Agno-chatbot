---
name: microsoft-office
description: 'Use for Word (.docx), PowerPoint (.pptx) and Excel (.xlsx/.csv): create documents, decks and workbooks, read, edit, fill templates, tracked changes, comments, formulas, charts.'
license: MIT
metadata:
  author: Nous Research
  version: "2.0.0"
  tags: "office word docx powerpoint pptx excel xlsx csv documents slides spreadsheets"
---

# Microsoft Office Skill

Adapted from hermes-agent (MIT, Nous Research).

Create, read, edit, and template Word (`.docx`), PowerPoint (`.pptx`), and Excel (`.xlsx`, `.csv`) files
offline with small Python CLIs built on python-docx, python-pptx, and openpyxl. Office itself is never
needed. It does not open legacy binary formats (`.doc`, `.ppt`, `.xls`) and does not render pages.

## Runtime here

Tool mapping (hermes -> this app): `write_file` -> `save_file`, `patch` -> `replace_file_chunk`,
`read_file` -> `read_file`; `terminal` / `"$PY" scripts/x.py args` ->
`run_skill_script(skill="microsoft-office", script="x.py", args=["..."])`. Scripts run with the user's workspace as
the working directory and the app's Python (libraries are installed); all paths are workspace-relative
(no absolute paths, no `..`). Not available: the `hermes` CLI, `vision_analyze`, `browser_exec`, a
browser, `soffice` (LibreOffice) or `skill_view` (use `get_skill_instructions(skill, paths=[...])` for
files). Where this text or a reference says `skill_view`/`vision_analyze`/`"$PY"`/`soffice`, use the
mapping above or skip the step.

## When to Use

Pick the format, then load its reference with `get_skill_instructions` before working:

| File | Reference | Typical asks |
| --- | --- | --- |
| `.docx` | `references/word.md` | reports, letters, contracts, `{{token}}` templates, tracked changes, comments |
| `.pptx` | `references/powerpoint.md` | pitch decks, brand-template decks, chart refreshes, speaker notes |
| `.xlsx`, `.csv` | `references/excel.md` | styled multi-sheet workbooks, formulas, charts, CSV conversion, row/column restructures |

Deeper notes: `references/revisions-and-comments.md` (Word review markup) and
`references/restructuring.md` (Excel reference shifting).

- Not for `.doc`/`.ppt`/`.xls` (no converter here, since `soffice` is not available) or
  `.odt`/`.odp`/`.ods`, or WYSIWYG layout work.

## Prerequisites

`python-docx`, `python-pptx` and `openpyxl` are already installed; there is no environment to set up.
Ignore any `$PY` instruction in the references. LibreOffice (`soffice`) and poppler are not available, so
`xlsx_recalc.py`, `pptx_render.py` and PDF/PNG conversion cannot run here.

## How to Run

Every helper lives in `scripts/`, is an argparse CLI with `--help`, prints JSON to stdout, and exits
non-zero on failure. Author JSON specs with `save_file`; read results from stdout or with `read_file`.

```bash
python scripts/docx_create.py spec.json out.docx    # run_skill_script(skill="microsoft-office", script="docx_create.py", args=["spec.json","out.docx"])
python scripts/pptx_create.py deck.json out.pptx
python scripts/xlsx_create.py spec.json report.xlsx
```

## Quick Reference

| Task | Word | PowerPoint | Excel |
| --- | --- | --- | --- |
| Create from JSON spec | `docx_create.py` | `pptx_create.py` | `xlsx_create.py`, `csv_to_xlsx.py` |
| Read back | `docx_read.py --text/--structure` | `pptx_read.py --outline` | `xlsx_read.py --sheets/--json` |
| Edit | `docx_edit.py` | `pptx_edit.py` | `xlsx_edit.py`, `xlsx_restructure.py` |
| Fill a template | `docx_template.py` | `pptx_from_template.py` | none |
| Review / check | `docx_revisions.py`, `docx_comments.py`, `docx_validate.py` | `pptx_render.py` (unavailable here) | `xlsx_recalc.py` (unavailable here), `xlsx_to_csv.py` |

The per-format reference has the full flag table.

## Procedure

1. Identify the format from the file extension or the ask, and load its reference.
2. Create, edit, or read with that format's helpers; pass an output path to keep the original whenever the
   helper supports one.
3. Verify the result as the reference's Verification section says, then give the user the exact output path.

## Converting to PDF

Not available here (`soffice` is not installed). There is no pure-Python path to PDF for these formats:
say so rather than approximating. For other sheets use `xlsx_to_csv.py --sheet NAME`.

## Pitfalls

- **Never unzip-and-edit the XML.** These files are zip packages; raw text substitution corrupts them.
  Edit through the helpers and use `replace_file_chunk`/`save_file` only for JSON inputs.
- **Text is split into runs.** Word and PowerPoint fragment text at edit boundaries; the replace helpers
  merge equal-format runs first, but a match across differently formatted runs takes the first run's
  formatting.
- **Nothing computes fields or formulas here.** Word TOC/page fields and Excel formulas are filled in by
  the office app on open; `xlsx_recalc.py` needs `soffice`, so cached values stay empty.
- **Encoding.** Write specs as UTF-8; the helpers read UTF-8 explicitly.
- Format-specific traps are in each reference.

## Verification

- Re-read every output with the format's read helper and check the expected content is there and the old
  content is gone.
- Word: `docx_validate.py out.docx` exits 0 after revision, comment, or field surgery.
- PowerPoint: `pptx_read.py --outline` (no rendering or image review here).
- Excel: `xlsx_read.py --formulas` lists written formulas.
