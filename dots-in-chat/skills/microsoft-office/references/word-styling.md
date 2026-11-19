# Word (.docx) styling (custom reference; hermes-agent has none)

`docx_create.py` applies a theme to every new document: coloured Title and headings (Heading 1 gets an
accent rule), Calibri body, banded tables with a coloured header row, callout boxes. The default
`professional` theme applies even with no `theme` key. Spec details:
`get_skill_instructions("microsoft-office", paths=["scripts/docx_create.py"])`.

## Themes

| Preset | Primary / accent | Use for |
| --- | --- | --- |
| `professional` | navy / blue | reports, proposals, memos |
| `modern` | teal / amber | product docs, updates |
| `warm` | terracotta / gold | marketing, education |
| `elegant` | charcoal / burgundy | legal, formal letters, executive briefs |
| `vibrant` | indigo / pink | creative, events |

Brand override: `"theme": {"preset": "professional", "primary": "0B5FFF", "accent": "FFB000", "font": "Georgia"}`.
Use fonts that ship with Word (Calibri, Arial, Georgia, Cambria, Times New Roman, Verdana). Optional
`heading_font` pairs a different face for headings.

## Structure recipe

1. First block: `{"type": "title", "text": ..., "subtitle": ...}` (coloured title + accent line).
2. Short opening summary paragraph or a `callout` (kind `info`) with the key takeaway.
3. `heading` level 1 per section, level 2 inside; do not skip levels (they feed the TOC).
4. Break up text with `bullet_list`, `numbered_list`, `table`, `callout`, `image`.
5. Tables: give `header` and `rows`, add `"align": ["left","right"]` for numbers, `col_widths_mm` summing to
   about 170 on A4 with 20mm margins. Leave `style` out to get the themed look; setting `style` (e.g.
   "Light Grid Accent 1") switches to that built-in look instead.
6. Callout kinds: `info` context, `success` wins, `warning` risks, `danger` blockers.
7. `header`/`footer` text and `"footer_page_numbers": true` for anything over one page; `toc` block for long docs.
8. Inline emphasis: paragraph `runs` with `bold`, `italic`, `color` (hex), `size_pt`.

## Rules of thumb

- Max 2 accent colours plus greys; colour means something (green good, red bad).
- Never colour body text; use bold for emphasis and the theme `primary` for key figures.
- White space: separate sections with headings, not blank paragraphs; use `divider` sparingly.
- Letters/contracts: `elegant`, no callouts, plain table style, margins 25mm.

## Example

```json
{"theme": "modern", "footer_page_numbers": true, "blocks": [
  {"type": "title", "text": "Project Status", "subtitle": "Week 46"},
  {"type": "callout", "kind": "success", "title": "On track", "text": "Milestone 2 shipped a week early."},
  {"type": "heading", "text": "Progress", "level": 1},
  {"type": "table", "header": ["Task", "Owner", "Status"],
   "rows": [["API", "Sam", "Done"], ["UI", "Lee", "In review"]]},
  {"type": "heading", "text": "Risks", "level": 1},
  {"type": "bullet_list", "items": ["Vendor delay", "Scope creep"]}]}
```

## Verify

`docx_validate.py out.docx` and `docx_read.py --structure out.docx`. There is no renderer here, so say the
visual check was not possible rather than claiming it. Editing existing files (`docx_edit.py`) keeps their styling.
