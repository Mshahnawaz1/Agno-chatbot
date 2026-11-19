#!/usr/bin/env python3
"""Create a .pptx presentation from a JSON deck spec.

Spec format (all positions/sizes in inches, colors as RRGGBB hex):
{
  "slide_size": "16:9",              // or "4:3" (default "16:9")
  "slides": [
    {"layout": "title", "title": "My Deck", "subtitle": "Q3 review"},
    {"layout": "title_content", "title": "Agenda",
     "bullets": ["Top item",
                 {"text": "Sub item", "level": 1, "bold": true,
                  "size": 18, "color": "CC0000", "font": "Arial",
                  "italic": false,
                  "link": "https://example.com/agenda"}],
     "background": "1F2937",           // solid slide background (hex)
     "footer": "Confidential",         // footer placeholder text
     "slide_number": true,             // enable slide-number placeholder
     "notes": "Speaker notes for this slide"},
    {"layout": "blank", "title": "Widgets",
     "images":  [{"path": "logo.png", "left": 1, "top": 1, "width": 3}],
     "tables":  [{"left": 1, "top": 2, "width": 6, "height": 2,
                  "rows": [["H1", "H2"], ["a", "b"]]}],
     "shapes":  [{"type": "rounded_rectangle", "left": 8, "top": 1,
                  "width": 3, "height": 1, "fill": "4472C4",
                  "text": "Callout", "text_color": "FFFFFF"}],
     "charts":  [{"type": "bar", "left": 1, "top": 3, "width": 6,
                  "height": 3.5, "title": "Sales",
                  "categories": ["Q1", "Q2"],
                  "series": {"North": [10, 20], "South": [7, 13]}}]}
  ]
}
Styling: a theme is always applied (default "professional"):
  "theme": "modern"  or  {"preset": "modern", "primary": "0F766E", "accent": "F59E0B",
                          "light": "ECF6F5", "text": "1F2937", "font": "Calibri",
                          "palette": ["0F766E", "F59E0B", "3B82F6"]}   // chart series colors
  Presets: professional, modern, warm, elegant, vibrant. Title/section slides get a solid
  primary background with white text; content slides get a primary edge band, accent rule,
  themed title/body, striped tables (header in primary), themed chart colors (override per
  chart with "colors": [...]). Shapes default to the accent fill. Table "size" (pt) and shape
  "size" are optional. Per-slide "background" and per-run "color"/"font" still override.
  See references/powerpoint-styling.md for design guidance.
Layouts: title, title_content, section, two_content, title_only, blank
Chart types: bar, bar_h, line, pie   Shape types: rectangle,
rounded_rectangle, oval, diamond, right_arrow, chevron
"""
import argparse
import copy
import json
import sys

from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

LAYOUTS = {"title": 0, "title_content": 1, "section": 2,
           "two_content": 3, "title_only": 5, "blank": 6}
CHART_TYPES = {"bar": XL_CHART_TYPE.COLUMN_CLUSTERED,
               "bar_h": XL_CHART_TYPE.BAR_CLUSTERED,
               "line": XL_CHART_TYPE.LINE_MARKERS,
               "pie": XL_CHART_TYPE.PIE}
SHAPE_TYPES = {"rectangle": MSO_SHAPE.RECTANGLE,
               "rounded_rectangle": MSO_SHAPE.ROUNDED_RECTANGLE,
               "oval": MSO_SHAPE.OVAL, "diamond": MSO_SHAPE.DIAMOND,
               "right_arrow": MSO_SHAPE.RIGHT_ARROW,
               "chevron": MSO_SHAPE.CHEVRON}


def style_run(run, spec):
    """Apply font styling from a bullet/text spec dict to a run."""
    font = run.font
    if spec.get("size"):
        font.size = Pt(spec["size"])
    if spec.get("bold") is not None:
        font.bold = spec["bold"]
    if spec.get("italic") is not None:
        font.italic = spec["italic"]
    if spec.get("font"):
        font.name = spec["font"]
    if spec.get("color"):
        font.color.rgb = RGBColor.from_string(spec["color"])
    if spec.get("link"):
        run.hyperlink.address = spec["link"]


def add_bullets(text_frame, bullets):
    text_frame.clear()
    for i, item in enumerate(bullets):
        if isinstance(item, str):
            item = {"text": item}
        para = text_frame.paragraphs[0] if i == 0 else text_frame.add_paragraph()
        para.level = int(item.get("level", 0))
        run = para.add_run()
        run.text = item.get("text", "")
        style_run(run, item)


def copy_layout_placeholder(slide, ph_idx):
    """Copy a layout placeholder (footer=11, slide number=12) onto the
    slide so it actually renders; returns the shape or None if the layout
    does not provide it."""
    for ph in slide.slide_layout.placeholders:
        if ph.placeholder_format.idx == ph_idx:
            slide.shapes._spTree.append(copy.deepcopy(ph._element))
            for shape in slide.placeholders:
                if shape.placeholder_format.idx == ph_idx:
                    return shape
    return None


def set_slide_title(slide, text, slide_width):
    """Set a layout title or add a conventional title box as fallback."""
    if slide.shapes.title is not None:
        slide.shapes.title.text = text
        return slide.shapes.title
    shape = slide.shapes.add_textbox(
        Inches(0.5), Inches(0.3), slide_width - Inches(1), Inches(0.8))
    run = shape.text_frame.paragraphs[0].add_run()
    run.text = text
    run.font.size = Pt(28)
    run.font.bold = True
    return shape


PRESETS = {
    "professional": {"primary": "1F3A5F", "accent": "2E75B6", "light": "EEF3F9",
                     "palette": ["1F3A5F", "2E75B6", "F2994A", "27AE60", "8E44AD", "7F8C8D"]},
    "modern": {"primary": "0F766E", "accent": "F59E0B", "light": "ECF6F5",
               "palette": ["0F766E", "F59E0B", "3B82F6", "EF4444", "8B5CF6", "64748B"]},
    "warm": {"primary": "9A3412", "accent": "D97706", "light": "FBF3EA",
             "palette": ["9A3412", "D97706", "65A30D", "0E7490", "A21CAF", "78716C"]},
    "elegant": {"primary": "2B2B2B", "accent": "9F1239", "light": "F4F1EE",
                "palette": ["2B2B2B", "9F1239", "B08D57", "4B6A88", "6B7280", "A8A29E"]},
    "vibrant": {"primary": "3730A3", "accent": "DB2777", "light": "F0EFFB",
                "palette": ["3730A3", "DB2777", "0EA5E9", "F59E0B", "10B981", "6B7280"]},
}
THEME = {}  # resolved in main(); see resolve_theme


def resolve_theme(spec_theme):
    theme = {"text": "1F2937", "muted": "6B7280", "font": "Calibri", "heading_font": None}
    preset, over = "professional", {}
    if isinstance(spec_theme, str):
        preset = spec_theme
    elif isinstance(spec_theme, dict):
        over = spec_theme
        preset = over.get("preset", preset)
    theme.update(PRESETS.get(str(preset).lower(), PRESETS["professional"]))
    theme.update({k: v for k, v in over.items() if k != "preset" and v})
    theme["heading_font"] = theme["heading_font"] or theme["font"]
    return theme


def _rgb(value):
    return RGBColor.from_string(str(value).lstrip("#").upper())


def _style_text(text_frame, size=None, color=None, bold=None, font=None):
    for para in text_frame.paragraphs:
        for run in para.runs:
            if font:
                run.font.name = font
            if size and not run.font.size:
                run.font.size = Pt(size)
            if color and run.font.color.type is None:
                run.font.color.rgb = _rgb(color)
            if bold is not None and run.font.bold is None:
                run.font.bold = bold


def _add_rect(slide, left, top, width, height, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = _rgb(fill)
    shape.line.fill.background()
    return shape


def apply_slide_theme(prs, slide, layout, spec):
    """Colors, fonts and geometry for one slide (default 16:9 template placeholders are 4:3-sized)."""
    t, W, H = THEME, prs.slide_width, prs.slide_height
    dark = layout in ("title", "section") and not spec.get("background")
    if dark:
        fill = slide.background.fill
        fill.solid()
        fill.fore_color.rgb = _rgb(t["primary"])
    title, margin = slide.shapes.title, Inches(0.7)
    body = next((p for p in slide.placeholders if p.placeholder_format.idx not in (0, 11, 12, 13)), None)
    title_color = "FFFFFF" if dark else t["primary"]
    if layout in ("title", "section"):
        if title is not None:
            title.left, title.top, title.width, title.height = margin, int(H * 0.28), W - 2 * margin, Inches(1.6)
            title.text_frame.word_wrap = True
            for p in title.text_frame.paragraphs:
                p.alignment = PP_ALIGN.LEFT
            _style_text(title.text_frame, 44 if layout == "title" else 38, title_color, True, t["heading_font"])
        if body is not None:
            body.left, body.top, body.width, body.height = margin, int(H * 0.28) + Inches(1.8), W - 2 * margin, Inches(1.2)
            for p in body.text_frame.paragraphs:
                p.alignment = PP_ALIGN.LEFT
            _style_text(body.text_frame, 22, "E5E7EB" if dark else t["muted"], False, t["font"])
        _add_rect(slide, margin, int(H * 0.28) + Inches(1.65), Inches(1.2), Inches(0.08), t["accent"])
        return
    if title is not None:
        title.left, title.top, title.width, title.height = margin, Inches(0.35), W - 2 * margin, Inches(0.95)
        title.text_frame.word_wrap = True
        for p in title.text_frame.paragraphs:
            p.alignment = PP_ALIGN.LEFT
        _style_text(title.text_frame, 32, t["primary"], True, t["heading_font"])
    _add_rect(slide, 0, 0, Inches(0.18), H, t["primary"])  # left edge band
    _add_rect(slide, margin, Inches(1.3), Inches(1.0), Inches(0.06), t["accent"])  # accent under title
    phs = [p for p in slide.placeholders if p.placeholder_format.idx not in (0, 11, 12, 13)]
    if layout == "two_content" and len(phs) >= 2:
        gap, w = Inches(0.4), int((W - 2 * margin - Inches(0.4)) / 2)
        for i, ph in enumerate(phs[:2]):
            ph.left, ph.top, ph.width, ph.height = margin + i * (w + gap), Inches(1.7), w, H - Inches(2.5)
    elif phs:
        phs[0].left, phs[0].top, phs[0].width, phs[0].height = margin, Inches(1.7), W - 2 * margin, H - Inches(2.5)
    for ph in phs:
        _style_text(ph.text_frame, 20, t["text"], None, t["font"])


def build_slide(prs, spec):
    layout_name = spec.get("layout", "title_content")
    layout_idx = LAYOUTS.get(layout_name, 1)
    slide = prs.slides.add_slide(prs.slide_layouts[layout_idx])

    if spec.get("background"):
        fill = slide.background.fill
        fill.solid()
        fill.fore_color.rgb = RGBColor.from_string(spec["background"])
    if spec.get("slide_number"):
        copy_layout_placeholder(slide, 12)
    if spec.get("footer"):
        shape = copy_layout_placeholder(slide, 11)
        if shape is not None:
            shape.text_frame.text = spec["footer"]

    if spec.get("title") is not None:
        set_slide_title(slide, spec["title"], prs.slide_width)
    if spec.get("subtitle") is not None:
        for ph in slide.placeholders:
            if ph.placeholder_format.idx == 1:
                ph.text = spec["subtitle"]
                break
    if spec.get("bullets"):
        body = next((ph for ph in slide.placeholders
                     if ph.placeholder_format.idx != 0), None)
        if body is None:
            body = slide.shapes.add_textbox(Inches(0.5), Inches(1.5),
                                            Inches(9), Inches(5))
        add_bullets(body.text_frame, spec["bullets"])

    apply_slide_theme(prs, slide, layout_name, spec)

    for img in spec.get("images", []):
        kwargs = {}
        if img.get("width"):
            kwargs["width"] = Inches(img["width"])
        if img.get("height"):
            kwargs["height"] = Inches(img["height"])
        slide.shapes.add_picture(img["path"], Inches(img.get("left", 1)),
                                 Inches(img.get("top", 1)), **kwargs)

    for tbl in spec.get("tables", []):
        rows = tbl["rows"]
        shape = slide.shapes.add_table(
            len(rows), len(rows[0]), Inches(tbl.get("left", 1)),
            Inches(tbl.get("top", 2)), Inches(tbl.get("width", 6)),
            Inches(tbl.get("height", 2)))
        for r, row in enumerate(rows):
            for c, val in enumerate(row):
                cell = shape.table.cell(r, c)
                cell.text = str(val)
                head = r == 0 and tbl.get("header", True)
                cell.fill.solid()
                cell.fill.fore_color.rgb = _rgb(THEME["primary"] if head else
                                                (THEME["light"] if r % 2 == 0 else "FFFFFF"))
                for para in cell.text_frame.paragraphs:
                    for run in para.runs:
                        run.font.size = Pt(tbl.get("size", 14))
                        run.font.name = THEME["font"]
                        run.font.bold = True if head else None
                        run.font.color.rgb = _rgb("FFFFFF" if head else THEME["text"])

    for shp in spec.get("shapes", []):
        shape = slide.shapes.add_shape(
            SHAPE_TYPES.get(shp.get("type", "rectangle"), MSO_SHAPE.RECTANGLE),
            Inches(shp.get("left", 1)), Inches(shp.get("top", 1)),
            Inches(shp.get("width", 2)), Inches(shp.get("height", 1)))
        shape.fill.solid()
        shape.fill.fore_color.rgb = _rgb(shp.get("fill") or THEME["accent"])
        shape.line.fill.background()
        if shp.get("text"):
            shape.text_frame.text = shp["text"]
            run = shape.text_frame.paragraphs[0].runs[0]
            run.font.color.rgb = _rgb(shp.get("text_color") or "FFFFFF")
            run.font.name = THEME["font"]
            run.font.size = Pt(shp.get("size", 16))

    for cht in spec.get("charts", []):
        data = CategoryChartData()
        data.categories = cht["categories"]
        for name, values in cht["series"].items():
            data.add_series(name, values)
        frame = slide.shapes.add_chart(
            CHART_TYPES.get(cht.get("type", "bar"),
                            XL_CHART_TYPE.COLUMN_CLUSTERED),
            Inches(cht.get("left", 1)), Inches(cht.get("top", 2)),
            Inches(cht.get("width", 6)), Inches(cht.get("height", 4)), data)
        chart = frame.chart
        chart.font.size = Pt(12)
        chart.font.name = THEME["font"]
        if cht.get("title"):
            chart.has_title = True
            chart.chart_title.text_frame.text = cht["title"]
            _style_text(chart.chart_title.text_frame, 16, THEME["primary"], True, THEME["heading_font"])
        palette = cht.get("colors") or THEME["palette"]
        if cht.get("type") == "pie":
            for i in range(len(cht["categories"])):
                point = chart.plots[0].series[0].points[i]
                point.format.fill.solid()
                point.format.fill.fore_color.rgb = _rgb(palette[i % len(palette)])
        else:
            for i, series in enumerate(chart.plots[0].series):
                color = _rgb(palette[i % len(palette)])
                if cht.get("type") == "line":
                    series.format.line.color.rgb = color
                    series.format.line.width = Pt(2.5)
                    series.marker.format.fill.solid()
                    series.marker.format.fill.fore_color.rgb = color
                else:
                    series.format.fill.solid()
                    series.format.fill.fore_color.rgb = color
        if len(cht["series"]) > 1 or cht.get("type") == "pie":
            chart.has_legend = True
            chart.legend.position = XL_LEGEND_POSITION.BOTTOM
            chart.legend.include_in_layout = False
        if cht.get("type") != "pie":
            chart.value_axis.major_gridlines.format.line.color.rgb = _rgb("E5E7EB")
            chart.value_axis.format.line.fill.background()

    if spec.get("notes"):
        slide.notes_slide.notes_text_frame.text = spec["notes"]
    return slide


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(
        description="Create a .pptx deck from a JSON spec.",
        epilog=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("spec", help="path to JSON deck spec")
    parser.add_argument("output", help="output .pptx path")
    args = parser.parse_args(argv)

    with open(args.spec, encoding="utf-8") as fh:
        spec = json.load(fh)

    THEME.update(resolve_theme(spec.get("theme")))
    prs = Presentation()
    if spec.get("slide_size", "16:9") == "16:9":
        prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
    else:
        prs.slide_width, prs.slide_height = Inches(10), Inches(7.5)

    for slide_spec in spec.get("slides", []):
        build_slide(prs, slide_spec)

    prs.save(args.output)
    print(json.dumps({"ok": True, "output": args.output,
                      "slides": len(prs.slides._sldIdLst)}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
