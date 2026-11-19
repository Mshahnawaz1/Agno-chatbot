#!/usr/bin/env python3
"""Create a styled PDF from a JSON spec using reportlab platypus.

Spec format (UTF-8 JSON). Colors are "RRGGBB" or "#RRGGBB" hex:
{
  "title": "Example Report",      // metadata AND the cover banner at the top of page 1
  "subtitle": "Q3 review",        // optional, under the title in the banner
  "date": "2026-11-18",           // optional small line in the banner
  "author": "example-author",
  "page_size": "A4",              // or "letter" (default: A4)
  "page_numbers": true,           // footer: title left, "Page N" right (default true)
  "banner": true,                 // draw the cover banner when a title is set (default true)
  "theme": "professional",        // preset name (below) or an object overriding any key:
                                  //   {"preset": "modern", "primary": "0F766E", "accent": "F59E0B",
                                  //    "text": "1F2937", "muted": "6B7280", "light": "F3F4F6",
                                  //    "font": "Helvetica"}   font: Helvetica | Times-Roman | Courier
  "elements": [
    {"type": "heading", "text": "Section 1", "level": 1},      // levels 1-3; level 1 gets an accent rule
    {"type": "paragraph", "text": "Body with <b>bold</b> and <font color='#C0392B'>color</font>.",
     "align": "left"},                                            // left | center | right | justify
    {"type": "bullets", "items": ["one", "two"]},                // add "numbered": true for 1. 2. 3.
    {"type": "callout", "kind": "info", "title": "Note", "text": "Boxed message"},
                                                                  // kind: info | success | warning | danger
    {"type": "kpis", "items": [{"label": "Revenue", "value": "$1.2M", "delta": "+12%"}]},
    {"type": "table", "rows": [["H1", "H2"], ["a", "b"]], "header": true,
     "col_widths": [200, 120], "align": ["left", "right"], "zebra": true},  // widths in points
    {"type": "image", "path": "chart.png", "width": 400, "caption": "Figure 1"},
    {"type": "divider"},
    {"type": "spacer", "height": 12},
    {"type": "pagebreak"}
  ]
}
Presets: professional (navy/blue), modern (teal/amber), warm (terracotta/gold),
elegant (charcoal/burgundy), vibrant (indigo/pink). Design guidance: references/styling.md.
"""
from __future__ import annotations

import argparse
import json
import sys

PRESETS = {
    "professional": {"primary": "1F3A5F", "accent": "2E75B6", "light": "EEF3F9"},
    "modern": {"primary": "0F766E", "accent": "F59E0B", "light": "ECF6F5"},
    "warm": {"primary": "9A3412", "accent": "D97706", "light": "FBF3EA"},
    "elegant": {"primary": "2B2B2B", "accent": "9F1239", "light": "F4F1EE"},
    "vibrant": {"primary": "3730A3", "accent": "DB2777", "light": "F0EFFB"},
}
BASE_THEME = {"text": "1F2937", "muted": "6B7280", "font": "Helvetica"}
CALLOUTS = {  # kind -> (accent bar, background)
    "info": ("2E75B6", "EAF2FB"),
    "success": ("2E8B57", "E8F5EE"),
    "warning": ("D98E04", "FFF4DC"),
    "danger": ("C0392B", "FBE9E7"),
}
FONT_FAMILIES = {
    "Helvetica": ("Helvetica", "Helvetica-Bold", "Helvetica-Oblique"),
    "Times-Roman": ("Times-Roman", "Times-Bold", "Times-Italic"),
    "Courier": ("Courier", "Courier-Bold", "Courier-Oblique"),
}


def _reconfigure_stdio() -> None:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except Exception:
            pass


def resolve_theme(spec_theme) -> dict:
    theme = dict(BASE_THEME)
    preset = "professional"
    overrides = {}
    if isinstance(spec_theme, str):
        preset = spec_theme
    elif isinstance(spec_theme, dict):
        overrides = spec_theme
        preset = overrides.get("preset", preset)
    theme.update(PRESETS.get(str(preset).lower(), PRESETS["professional"]))
    theme.update({k: v for k, v in overrides.items() if k != "preset" and v})
    if theme["font"] not in FONT_FAMILIES:
        theme["font"] = "Helvetica"
    return theme


def build_pdf(spec: dict, out_path: str) -> int:
    try:
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
        from reportlab.lib.pagesizes import A4, letter
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import (
            HRFlowable,
            Image,
            KeepTogether,
            ListFlowable,
            ListItem,
            PageBreak,
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )
    except ImportError:
        print("Missing dependency: 'reportlab' is not importable here; rerun with the documents interpreter $PY from the pdf skill's Prerequisites setup block", file=sys.stderr)
        return 2

    def hexc(value: str):
        return colors.HexColor("#" + str(value).lstrip("#"))

    theme = resolve_theme(spec.get("theme"))
    primary, accent, light = hexc(theme["primary"]), hexc(theme["accent"]), hexc(theme["light"])
    text_c, muted_c = hexc(theme["text"]), hexc(theme["muted"])
    regular, bold, italic = FONT_FAMILIES[theme["font"]]

    page_size = letter if str(spec.get("page_size", "A4")).lower() == "letter" else A4
    margin = 0.8 * inch
    frame_w = page_size[0] - 2 * margin
    aligns = {"left": TA_LEFT, "center": TA_CENTER, "right": TA_RIGHT, "justify": TA_JUSTIFY}

    body = ParagraphStyle("body", fontName=regular, fontSize=10.5, leading=15, textColor=text_c, spaceAfter=6)
    h = {
        1: ParagraphStyle("h1", fontName=bold, fontSize=18, leading=22, textColor=primary, spaceBefore=14, spaceAfter=4),
        2: ParagraphStyle("h2", fontName=bold, fontSize=14, leading=18, textColor=primary, spaceBefore=10, spaceAfter=4),
        3: ParagraphStyle("h3", fontName=bold, fontSize=11.5, leading=15, textColor=accent, spaceBefore=8, spaceAfter=3),
    }
    cell = ParagraphStyle("cell", fontName=regular, fontSize=9.5, leading=12.5, textColor=text_c)
    cell_head = ParagraphStyle("cellh", parent=cell, fontName=bold, textColor=colors.white)
    caption = ParagraphStyle("caption", fontName=italic, fontSize=8.5, leading=11, textColor=muted_c, alignment=TA_CENTER, spaceAfter=8)

    story = []

    title = spec.get("title")
    if title and spec.get("banner", True):
        t_style = ParagraphStyle("bt", fontName=bold, fontSize=24, leading=28, textColor=colors.white)
        s_style = ParagraphStyle("bs", fontName=regular, fontSize=12, leading=16, textColor=colors.HexColor("#E5E7EB"))
        rows = [[Paragraph(str(title), t_style)]]
        if spec.get("subtitle"):
            rows.append([Paragraph(str(spec["subtitle"]), s_style)])
        if spec.get("date"):
            rows.append([Paragraph(str(spec["date"]), ParagraphStyle("bd", parent=s_style, fontSize=9.5))])
        banner = Table(rows, colWidths=[frame_w])
        banner.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), primary),
            ("LINEBELOW", (0, -1), (-1, -1), 4, accent),
            ("LEFTPADDING", (0, 0), (-1, -1), 18), ("RIGHTPADDING", (0, 0), (-1, -1), 18),
            ("TOPPADDING", (0, 0), (-1, 0), 18), ("BOTTOMPADDING", (0, -1), (-1, -1), 16),
            ("TOPPADDING", (0, 1), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -2), 2),
        ]))
        story += [banner, Spacer(1, 14)]

    def para_cell(value, style):
        return Paragraph(str(value), style)

    for el in spec.get("elements", []):
        etype = el.get("type")
        if etype == "heading":
            level = min(max(int(el.get("level", 1)), 1), 3)
            items = [Paragraph(el.get("text", ""), h[level])]
            if level == 1:
                items.append(HRFlowable(width="100%", thickness=1.5, color=accent, spaceAfter=6))
            story.append(KeepTogether(items))
        elif etype == "paragraph":
            style = ParagraphStyle("p", parent=body, alignment=aligns.get(el.get("align", "left"), TA_LEFT))
            story.append(Paragraph(el.get("text", ""), style))
        elif etype == "bullets":
            items = [ListItem(Paragraph(str(i), body), leftIndent=14) for i in el.get("items", [])]
            kwargs = {"bulletType": "1", "bulletFormat": "%s."} if el.get("numbered") else {"bulletType": "bullet", "start": "•"}
            story.append(ListFlowable(items, bulletColor=accent, bulletFontName=bold, leftIndent=14, **kwargs))
            story.append(Spacer(1, 6))
        elif etype == "callout":
            bar, bg = CALLOUTS.get(el.get("kind", "info"), CALLOUTS["info"])
            parts = []
            if el.get("title"):
                parts.append(Paragraph(str(el["title"]), ParagraphStyle("ct", parent=body, fontName=bold, textColor=hexc(bar), spaceAfter=2)))
            parts.append(Paragraph(el.get("text", ""), ParagraphStyle("cb", parent=body, spaceAfter=0)))
            box = Table([[parts]], colWidths=[frame_w])
            box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), hexc(bg)),
                ("LINEBEFORE", (0, 0), (0, -1), 4, hexc(bar)),
                ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]))
            story += [box, Spacer(1, 10)]
        elif etype == "kpis":
            items = el.get("items", [])
            if not items:
                continue
            gap = 8
            w = (frame_w - gap * (len(items) - 1)) / len(items)
            cards = []
            for it in items:
                inner = [
                    Paragraph(str(it.get("value", "")), ParagraphStyle("kv", fontName=bold, fontSize=20, leading=24, textColor=primary)),
                    Paragraph(str(it.get("label", "")), ParagraphStyle("kl", fontName=regular, fontSize=9, leading=12, textColor=muted_c)),
                ]
                if it.get("delta"):
                    neg = str(it["delta"]).strip().startswith("-")
                    inner.append(Paragraph(str(it["delta"]), ParagraphStyle(
                        "kd", fontName=bold, fontSize=9, leading=12, textColor=hexc("C0392B" if neg else "2E8B57"))))
                cards.append(inner)
            row = Table([cards], colWidths=[w] * len(items))
            row.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), light),
                ("LINEABOVE", (0, 0), (-1, 0), 3, accent), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                *[("LINEAFTER", (i, 0), (i, 0), gap, colors.white) for i in range(len(items) - 1)],
            ]))
            story += [row, Spacer(1, 12)]
        elif etype == "table":
            rows = el.get("rows", [])
            if not rows:
                continue
            has_header = el.get("header", True)
            col_align = el.get("align", [])
            data = []
            for r, row in enumerate(rows):
                out = []
                for c, val in enumerate(row):
                    a = col_align[c] if c < len(col_align) else "left"
                    base = cell_head if (has_header and r == 0) else cell
                    out.append(para_cell(val, ParagraphStyle("c", parent=base, alignment=aligns.get(a, TA_LEFT))))
                data.append(out)
            table = Table(data, colWidths=el.get("col_widths"), repeatRows=1 if has_header else 0)
            style = [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#D1D5DB")),
                ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
            if has_header:
                style.append(("BACKGROUND", (0, 0), (-1, 0), primary))
            if el.get("zebra", True):
                start = 1 if has_header else 0
                for r in range(start + (1 if has_header else 1), len(rows), 2):
                    style.append(("BACKGROUND", (0, r), (-1, r), light))
            table.setStyle(TableStyle(style))
            story += [table, Spacer(1, 10)]
        elif etype == "image":
            kwargs = {}
            if el.get("width"):
                kwargs["width"] = float(el["width"])
            if el.get("height"):
                kwargs["height"] = float(el["height"])
            img = Image(el["path"], **kwargs)
            if "width" in kwargs and "height" not in kwargs:
                ratio = img.imageHeight / img.imageWidth  # keep aspect ratio
                img.drawWidth = kwargs["width"]
                img.drawHeight = kwargs["width"] * ratio
            story.append(img)
            story.append(Paragraph(el["caption"], caption) if el.get("caption") else Spacer(1, 10))
        elif etype == "divider":
            story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#D1D5DB"), spaceBefore=6, spaceAfter=8))
        elif etype == "spacer":
            story.append(Spacer(1, float(el.get("height", 12))))
        elif etype == "pagebreak":
            story.append(PageBreak())
        else:
            print(f"Warning: unknown element type {etype!r}, skipped", file=sys.stderr)

    def draw_page(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(accent)
        canvas.setLineWidth(1)
        canvas.line(margin, 0.62 * inch, page_size[0] - margin, 0.62 * inch)
        canvas.setFont(regular, 8.5)
        canvas.setFillColor(muted_c)
        if title:
            canvas.drawString(margin, 0.45 * inch, str(title)[:80])
        if spec.get("page_numbers", True):
            canvas.drawRightString(page_size[0] - margin, 0.45 * inch, f"Page {doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(
        out_path,
        pagesize=page_size,
        leftMargin=margin, rightMargin=margin, topMargin=0.8 * inch, bottomMargin=0.9 * inch,
        title=spec.get("title", ""),
        author=spec.get("author", ""),
    )
    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    print(json.dumps({"output": out_path, "elements": len(spec.get("elements", [])),
                      "theme": {k: theme[k] for k in ("primary", "accent", "font")}}))
    return 0


def main() -> int:
    _reconfigure_stdio()
    parser = argparse.ArgumentParser(
        description="Create a styled PDF from a JSON spec (reportlab).",
        epilog=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("spec", help="Path to UTF-8 JSON spec file")
    parser.add_argument("-o", "--output", required=True, help="Output PDF path")
    args = parser.parse_args()
    with open(args.spec, encoding="utf-8") as fh:
        spec = json.load(fh)
    return build_pdf(spec, args.output)


if __name__ == "__main__":
    sys.exit(main())
