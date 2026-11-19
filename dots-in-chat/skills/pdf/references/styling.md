# PDF styling (custom reference; hermes-agent has none)

`pdf_create.py` styles every PDF with a theme: coloured cover banner, accent rules, striped tables,
footer with title and page number. A plain spec already comes out coloured (default `professional`).
Do not hand-draw colours with stamps; use the spec options below. Full key list:
`get_skill_instructions("pdf", paths=["scripts/pdf_create.py"])`.

## Pick a theme by the document's purpose

| Preset | Primary / accent | Use for |
| --- | --- | --- |
| `professional` | navy / blue | business reports, proposals, finance |
| `modern` | teal / amber | product, tech, status updates |
| `warm` | terracotta / gold | marketing, hospitality, education |
| `elegant` | charcoal / burgundy | legal, executive summaries, formal letters |
| `vibrant` | indigo / pink | creative, events, newsletters |

Match the user's brand when named: `"theme": {"preset": "modern", "primary": "0B5FFF", "accent": "FFB000"}`.
Keep primary dark enough for white text (cover banner and table headers are white on primary). Font is
`Helvetica` (default), `Times-Roman` (formal) or `Courier` (code/logs); no other fonts exist in the runtime.

## Structure recipe

1. Top-level `title` (+ `subtitle`, `date`) gives the banner; do not repeat it as a heading.
2. Open with a `kpis` row (3-4 cards, short values) or a `callout` summary when the data has headline numbers.
3. `heading` level 1 per major section (accent rule), level 2 for subsections; never skip levels.
4. Mix element types so pages are not walls of text: paragraph, `bullets`, `table`, `image`, `callout`.
5. Use `callout` kinds by meaning: `info` context, `success` wins, `warning` risks, `danger` blockers.
6. Charts: render with matplotlib using the theme's primary/accent hex values, save a PNG, add as `image`
   with `width` about 440 and a `caption`.

## Rules of thumb

- At most 2 accent colours plus neutrals; colour carries meaning (green good, red bad), not decoration.
- Tables: header row on, `zebra` on, right-align numeric columns via `"align": ["left","right","right"]`,
  set `col_widths` (points; A4 text width is about 470) when one column should be wider. Keep to 6 columns.
- Inline emphasis uses reportlab markup in text: `<b>`, `<i>`, `<font color="#C0392B">`, `<a href="...">`.
  Escape a literal `&` as `&amp;` and `<` as `&lt;`.
- Body text stays dark grey; do not colour whole paragraphs.
- One idea per page region; use `pagebreak` before a new major section only if the previous page is mostly full.

## Example

```json
{"title": "Q3 Sales Report", "subtitle": "North America", "date": "2026-11-18", "theme": "professional",
 "elements": [
  {"type": "kpis", "items": [{"label": "Revenue", "value": "$1.2M", "delta": "+12%"},
                             {"label": "Churn", "value": "3%", "delta": "-1%"}]},
  {"type": "heading", "text": "Highlights", "level": 1},
  {"type": "bullets", "items": ["Enterprise deals doubled", "EMEA launch on track"]},
  {"type": "callout", "kind": "warning", "title": "Risk", "text": "Supplier delays may hit Q4."},
  {"type": "table", "rows": [["Region", "Sales"], ["East", "$420k"], ["West", "$310k"]],
   "align": ["left", "right"]}]}
```

## Verify

`pdf_read.py out.pdf --meta` for page count and `--text` for content. Colours cannot be checked from text;
trust the spec. Other PDF tasks (merge, forms, stamps) keep their original styling.
