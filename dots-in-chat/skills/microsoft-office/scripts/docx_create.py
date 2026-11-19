#!/usr/bin/env python3
# MIT License. Part of the Hermes docx skill.
"""Create a .docx document from a JSON spec.

Usage: docx_create.py spec.json output.docx
Run with --help for the spec format summary.

Spec (JSON object):
{
  "page": {"width_mm": 210, "height_mm": 297,
           "margins_mm": {"top": 25, "bottom": 25, "left": 20, "right": 20}},
  "header": "text shown in page header",
  "footer": "text shown in page footer",
  "styles": [{"name": "MyStyle", "base": "Normal", "font": "Arial",
              "size_pt": 12, "bold": true, "color": "1F4E79"}],
  "blocks": [
    {"type": "heading", "text": "Title", "level": 1},
    {"type": "paragraph", "style": "MyStyle", "runs": [
        {"text": "plain "}, {"text": "bold", "bold": true},
        {"text": " italic", "italic": true},
        {"text": " under", "underline": true}]},
    {"type": "paragraph", "text": "shortcut: single plain run"},
    {"type": "bullet_list", "items": ["a", "b"]},
    {"type": "numbered_list", "items": ["one", "two"]},
    {"type": "table", "header": ["Col1", "Col2"],
     "rows": [["1", "2"]], "style": "Light Grid Accent 1",
     "header_bold": true},
    {"type": "image", "path": "pic.png", "width_mm": 60},
    {"type": "page_break"},
    {"type": "toc"}
  ]
}

Styling (default theme "professional" is applied even when "theme" is omitted):
  "theme": "modern"  or  {"preset": "modern", "primary": "0F766E", "accent": "F59E0B",
                          "text": "1F2937", "light": "ECF6F5", "font": "Calibri",
                          "heading_font": "Calibri"}
  Presets: professional, modern, warm, elegant, vibrant. Headings, Title, tables and
  callouts use the theme colours. Extra blocks:
    {"type": "title", "text": "Report", "subtitle": "Q3 review"}      // coloured title + accent rule
    {"type": "callout", "kind": "info|success|warning|danger", "title": "Note", "text": "..."}
    {"type": "divider"}
    table: "zebra": true (default), "col_widths_mm": [40, 30], "align": ["left", "right"]
    paragraph runs also accept "color" (hex), "size_pt", "font".
  See references/word-styling.md for design guidance.

Extras: `"footer_page_numbers": true` at the top level adds a
"Page X of Y" footer built from PAGE/NUMPAGES fields, and a `toc` block
inserts a Table of Contents field. Field results are computed by
Word/LibreOffice when the file is opened, not by python-docx.
"""
from __future__ import annotations

import argparse
import json
import sys

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Mm, Pt, RGBColor


def apply_page(doc, page: dict) -> None:
    section = doc.sections[0]
    if "width_mm" in page:
        section.page_width = Mm(page["width_mm"])
    if "height_mm" in page:
        section.page_height = Mm(page["height_mm"])
    m = page.get("margins_mm", {})
    for side in ("top", "bottom", "left", "right"):
        if side in m:
            setattr(section, f"{side}_margin", Mm(m[side]))


def add_styles(doc, styles: list) -> None:
    for s in styles:
        style = doc.styles.add_style(s["name"], WD_STYLE_TYPE.PARAGRAPH)
        if s.get("base"):
            style.base_style = doc.styles[s["base"]]
        font = style.font
        if s.get("font"):
            font.name = s["font"]
        if s.get("size_pt"):
            font.size = Pt(s["size_pt"])
        if s.get("bold") is not None:
            font.bold = s["bold"]
        if s.get("italic") is not None:
            font.italic = s["italic"]
        if s.get("color"):
            font.color.rgb = RGBColor.from_string(s["color"])


PRESETS = {
    "professional": {"primary": "1F3A5F", "accent": "2E75B6", "light": "EEF3F9"},
    "modern": {"primary": "0F766E", "accent": "F59E0B", "light": "ECF6F5"},
    "warm": {"primary": "9A3412", "accent": "D97706", "light": "FBF3EA"},
    "elegant": {"primary": "2B2B2B", "accent": "9F1239", "light": "F4F1EE"},
    "vibrant": {"primary": "3730A3", "accent": "DB2777", "light": "F0EFFB"},
}
CALLOUTS = {"info": ("2E75B6", "EAF2FB"), "success": ("2E8B57", "E8F5EE"),
            "warning": ("D98E04", "FFF4DC"), "danger": ("C0392B", "FBE9E7")}
THEME: dict = {}


def resolve_theme(spec_theme) -> dict:
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


def _hex(value: str) -> str:
    return str(value).lstrip("#").upper()


def _set_font(font, name=None, size=None, color=None, bold=None) -> None:
    if name:
        font.name = name
        rfonts = font._element.get_or_add_rPr().get_or_add_rFonts()
        for attr in ("w:eastAsia", "w:cs"):
            rfonts.set(qn(attr), name)
    if size:
        font.size = Pt(size)
    if color:
        font.color.rgb = RGBColor.from_string(_hex(color))
    if bold is not None:
        font.bold = bold


def apply_theme(doc, theme: dict) -> None:
    styles = doc.styles
    _set_font(styles["Normal"].font, theme["font"], 11, theme["text"])
    styles["Normal"].paragraph_format.space_after = Pt(6)
    sizes = {"Title": (26, theme["primary"]), "Heading 1": (18, theme["primary"]),
             "Heading 2": (14, theme["primary"]), "Heading 3": (12, theme["accent"])}
    for name, (size, color) in sizes.items():
        if name in [s.name for s in styles]:
            _set_font(styles[name].font, theme["heading_font"], size, color, True)
    if "Heading 1" in [s.name for s in styles]:
        styles["Heading 1"].paragraph_format.space_before = Pt(18)
        _border(styles["Heading 1"].element.get_or_add_pPr(), "bottom", theme["accent"], 8)


def _insert_before(parent, el, successors: tuple) -> None:
    """Insert `el` ahead of the first existing child named in `successors` (OOXML child order)."""
    for child in parent:
        if child.tag in [qn(s) for s in successors]:
            child.addprevious(el)
            return
    parent.append(el)


PPR_AFTER_BDR = ("w:shd", "w:tabs", "w:suppressAutoHyphens", "w:kinsoku", "w:wordWrap", "w:overflowPunct",
                 "w:topLinePunct", "w:autoSpaceDE", "w:autoSpaceDN", "w:bidi", "w:adjustRightInd",
                 "w:snapToGrid", "w:spacing", "w:ind", "w:contextualSpacing", "w:mirrorIndents",
                 "w:suppressOverlap", "w:jc", "w:textDirection", "w:textAlignment", "w:textboxTightWrap",
                 "w:outlineLvl", "w:divId", "w:cnfStyle", "w:rPr", "w:sectPr", "w:pPrChange")
TBLPR_AFTER_BORDERS = ("w:shd", "w:tblLayout", "w:tblCellMar", "w:tblLook", "w:tblCaption")
TBLPR_AFTER_MAR = ("w:tblLook", "w:tblCaption")
TCPR_AFTER_BORDERS = ("w:shd", "w:noWrap", "w:tcMar", "w:textDirection", "w:tcFitText", "w:vAlign", "w:hideMark")
TCPR_AFTER_SHD = ("w:noWrap", "w:tcMar", "w:textDirection", "w:tcFitText", "w:vAlign", "w:hideMark")


def _border(parent, side: str, color: str, size: int, space: int = 2) -> None:
    pbdr = parent.find(qn("w:pBdr"))
    if pbdr is None:
        pbdr = OxmlElement("w:pBdr")
        _insert_before(parent, pbdr, PPR_AFTER_BDR)
    el = OxmlElement(f"w:{side}")
    for k, v in (("val", "single"), ("sz", str(size)), ("space", str(space)), ("color", _hex(color))):
        el.set(qn(f"w:{k}"), v)
    pbdr.append(el)


def _shade(cell, fill: str) -> None:
    tcpr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), _hex(fill))
    _insert_before(tcpr, shd, TCPR_AFTER_SHD)


def _cell_borders(table, color: str = "D1D5DB") -> None:
    tblpr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{side}")
        horizontal = side in ("top", "bottom", "insideH")
        el.set(qn("w:val"), "single" if horizontal else "nil")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:color"), _hex(color))
        borders.append(el)
    _insert_before(tblpr, borders, TBLPR_AFTER_BORDERS)


def _cell_margins(table, top=60, bottom=60, left=100, right=100) -> None:
    mar = OxmlElement("w:tblCellMar")
    for side, w in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(w))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    _insert_before(table._tbl.tblPr, mar, TBLPR_AFTER_MAR)


def add_styled_table(doc, block: dict) -> None:
    header, rows = block.get("header", []), block.get("rows", [])
    ncols = len(header) if header else (len(rows[0]) if rows else 1)
    table = doc.add_table(rows=0, cols=ncols)
    custom = block.get("style")
    if custom:
        table.style = custom  # an explicit built-in style name wins over the theme look
    else:
        _cell_borders(table)
        _cell_margins(table)
    aligns = block.get("align", [])
    widths = block.get("col_widths_mm", [])

    def fill(cells, values, is_header=False, band=False):
        for i, text in enumerate(values):
            cell = cells[i]
            cell.text = str(text)
            if i < len(widths):
                cell.width = Mm(widths[i])
            para = cell.paragraphs[0]
            if i < len(aligns):
                para.alignment = {"left": WD_ALIGN_PARAGRAPH.LEFT, "center": WD_ALIGN_PARAGRAPH.CENTER,
                                  "right": WD_ALIGN_PARAGRAPH.RIGHT}.get(aligns[i])
            para.paragraph_format.space_after = Pt(0)
            for run in para.runs:
                if is_header:
                    run.bold = block.get("header_bold", True)
                    if not custom:
                        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            if not custom:
                if is_header:
                    _shade(cell, THEME["primary"])
                elif band:
                    _shade(cell, THEME["light"])

    if header:
        fill(table.add_row().cells, header, is_header=True)
    for n, row in enumerate(rows):
        fill(table.add_row().cells, row, band=block.get("zebra", True) and n % 2 == 1)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_callout(doc, block: dict) -> None:
    bar, bg = CALLOUTS.get(block.get("kind", "info"), CALLOUTS["info"])
    table = doc.add_table(rows=1, cols=1)
    cell = table.rows[0].cells[0]
    _shade(cell, bg)
    tcpr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    left = OxmlElement("w:left")
    for k, v in (("val", "single"), ("sz", "32"), ("color", bar), ("space", "0")):
        left.set(qn(f"w:{k}"), v)
    borders.append(left)
    _insert_before(tcpr, borders, TCPR_AFTER_BORDERS)
    _cell_margins(table, 100, 100, 180, 140)
    para = cell.paragraphs[0]
    if block.get("title"):
        run = para.add_run(block["title"])
        run.bold = True
        run.font.color.rgb = RGBColor.from_string(bar)
        para = cell.add_paragraph()
    para.add_run(block.get("text", ""))
    para.paragraph_format.space_after = Pt(0)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_runs(para, block: dict) -> None:
    runs = block.get("runs")
    if runs is None:
        runs = [{"text": block.get("text", "")}]
    for r in runs:
        run = para.add_run(r.get("text", ""))
        if r.get("bold"):
            run.bold = True
        if r.get("italic"):
            run.italic = True
        if r.get("underline"):
            run.underline = True
        if r.get("color") or r.get("size_pt") or r.get("font"):
            _set_font(run.font, r.get("font"), r.get("size_pt"), r.get("color"))


def add_block(doc, block: dict) -> None:
    btype = block["type"]
    if btype == "heading":
        doc.add_heading(block.get("text", ""), level=block.get("level", 1))
    elif btype == "title":
        doc.add_paragraph(block.get("text", ""), style="Title")
        if block.get("subtitle"):
            sub = doc.add_paragraph()
            run = sub.add_run(block["subtitle"])
            _set_font(run.font, THEME["font"], 13, THEME["muted"])
            _border(sub._p.get_or_add_pPr(), "bottom", THEME["accent"], 18, 6)
    elif btype == "callout":
        add_callout(doc, block)
    elif btype == "divider":
        _border(doc.add_paragraph()._p.get_or_add_pPr(), "bottom", "D1D5DB", 6)
    elif btype == "paragraph":
        para = doc.add_paragraph(style=block.get("style"))
        add_runs(para, block)
    elif btype == "bullet_list":
        for item in block.get("items", []):
            doc.add_paragraph(item, style="List Bullet")
    elif btype == "numbered_list":
        for item in block.get("items", []):
            doc.add_paragraph(item, style="List Number")
    elif btype == "table":
        add_styled_table(doc, block)
    elif btype == "image":
        width = Mm(block["width_mm"]) if block.get("width_mm") else None
        doc.add_picture(block["path"], width=width)
    elif btype == "page_break":
        doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
    elif btype == "toc":
        from docx_edit import _add_field
        para = doc.add_paragraph()
        _add_field(para, r' TOC \o "1-3" \h \z \u ',
                   "Table of contents - open in Word/LibreOffice and "
                   "update fields to populate.")
    else:
        raise ValueError(f"unknown block type: {btype}")


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Create a .docx from a JSON spec.",
        epilog="See the module docstring (top of this file) for the spec format.")
    ap.add_argument("spec", help="path to JSON spec file")
    ap.add_argument("output", help="path of .docx to write")
    args = ap.parse_args()

    with open(args.spec, encoding="utf-8") as f:
        spec = json.load(f)

    doc = Document()
    THEME.update(resolve_theme(spec.get("theme")))
    apply_theme(doc, THEME)
    if spec.get("page"):
        apply_page(doc, spec["page"])
    if spec.get("styles"):
        add_styles(doc, spec["styles"])
    if spec.get("header"):
        doc.sections[0].header.paragraphs[0].text = spec["header"]
    if spec.get("footer"):
        doc.sections[0].footer.paragraphs[0].text = spec["footer"]
    for block in spec.get("blocks", []):
        add_block(doc, block)
    if spec.get("footer_page_numbers"):
        from docx_edit import _add_field
        para = doc.sections[0].footer.paragraphs[0]
        para.add_run("Page ")
        _add_field(para, " PAGE ", "1")
        para.add_run(" of ")
        _add_field(para, " NUMPAGES ", "1")
    doc.save(args.output)
    print(json.dumps({"ok": True, "output": args.output,
                      "blocks": len(spec.get("blocks", []))}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
