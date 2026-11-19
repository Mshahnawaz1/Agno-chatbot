# PowerPoint (.pptx) styling (custom reference; hermes-agent has none for plain decks)

hermes-agent's `finance/pptx-author` only says to load a firm template for brand colours. Without one,
use the theme built into `pptx_create.py`. A theme is always applied (default `professional`): title and
section slides get a solid primary background with white text, content slides get a primary edge band,
accent rule under the title, themed fonts, striped tables, and chart colours from the palette. Spec details:
`get_skill_instructions("microsoft-office", paths=["scripts/pptx_create.py"])`.

## Themes

| Preset | Primary / accent | Use for |
| --- | --- | --- |
| `professional` | navy / blue | business, finance, strategy |
| `modern` | teal / amber | product, tech, startups |
| `warm` | terracotta / gold | marketing, education, hospitality |
| `elegant` | charcoal / burgundy | executive, legal, luxury |
| `vibrant` | indigo / pink | creative, events, pitches |

Brand override: `"theme": {"preset": "modern", "primary": "0B5FFF", "accent": "FFB000", "font": "Arial",
"palette": ["0B5FFF", "FFB000", "10B981"]}`. A brand template `.pptx` from the user takes priority:
use `pptx_from_template.py` and do not theme.

## Deck structure

1. `title` slide: deck title, subtitle with audience/date.
2. Agenda or one-line summary (`title_content`, 3-5 bullets).
3. One message per slide: the `title` states the takeaway ("Revenue grew 12% on EMEA"), not a topic label.
4. `section` slides between major parts (dark divider).
5. Closing: summary or next steps, then contacts.

## Per-slide rules

- 3-5 bullets, each under about 12 words; sub-bullets (`level` 1) sparingly. No walls of text.
- Pair text with a visual: bullets on a `two_content` slide, or `title_only` with a chart/table/shapes.
- Charts: `bar`/`bar_h` to compare, `line` for time, `pie` only for 2-5 parts of a whole. Always `title` the
  chart; multi-series charts get a legend automatically. Keep categories under 8.
- Tables: at most 5 columns and 6 rows per slide; split otherwise. Position `left` 0.7, `top` about 1.8,
  width up to 11.9 inches on 16:9 (slide is 13.333 x 7.5 in).
- Callout / KPI cards: `rounded_rectangle` shapes with `text` (accent fill by default), e.g. three cards
  of width 3.6 at left 0.7 / 4.9 / 9.1, top 2.2, height 1.6, `size` 24.
- Put `notes` on each slide for the talking points; `footer` and `slide_number: true` on content slides.
- Colour carries meaning: accent for the thing to look at, green/red only for good/bad.
- Do not set per-slide `background` or per-run `color` unless needed; they override the theme and break
  consistency. Dark text on light slides, white on dark.

## Example

```json
{"theme": "modern", "slides": [
 {"layout": "title", "title": "Q3 Business Review", "subtitle": "Sales team, Nov 2026"},
 {"layout": "title_content", "title": "Revenue grew 12%, led by EMEA",
  "bullets": ["$1.2M total revenue", {"text": "EMEA up 24%", "level": 1}, "Churn down to 3%"],
  "slide_number": true, "notes": "Open with the headline number."},
 {"layout": "title_only", "title": "Sales by quarter",
  "charts": [{"type": "bar", "left": 0.7, "top": 1.8, "width": 7.5, "height": 4.8, "title": "Sales ($k)",
              "categories": ["Q1", "Q2", "Q3"], "series": {"North": [90, 120, 140], "South": [60, 70, 95]}}],
  "shapes": [{"type": "rounded_rectangle", "left": 8.8, "top": 2.2, "width": 3.8, "height": 1.6,
              "text": "+12% QoQ", "size": 28}]},
 {"layout": "section", "title": "Next steps"}]}
```

## Verify

`pptx_read.py out.pptx --outline` for slide count, titles, tables and chart data. Rendering is unavailable
here, so state that layout was not visually checked. Editing existing decks (`pptx_edit.py`) keeps their styling.
