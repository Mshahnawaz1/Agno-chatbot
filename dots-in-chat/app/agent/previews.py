"""Preview renderers for the files panel: .docx and .md to sanitised HTML.

(.html previews inject a CSP in formats.py; .pdf previews are the real file, fetched by the client.)
Documents themselves are made by skill scripts (see skill_runner.py), not here.
"""
import html as _html
from pathlib import Path

import mammoth
import nh3
from markdown_it import MarkdownIt

from app.agent.workspace import MAX_DOCX_BYTES, MAX_PPTX_BYTES, MAX_XLSX_BYTES

_md = MarkdownIt("commonmark", {"html": False}).enable("table")

PREVIEW_TAGS = {
    "p", "br", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "em", "b", "i", "u", "code", "pre",
    "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "blockquote", "a", "hr", "sub", "sup",
}


def sanitize_html(html: str) -> str:
    """Allow-list sanitiser: no scripts, no images (mammoth inlines them as data: URIs), safe links."""
    return nh3.clean(
        html,
        tags=PREVIEW_TAGS,
        attributes={"a": {"href"}, "td": {"colspan", "rowspan"}, "th": {"colspan", "rowspan"}},
        url_schemes={"http", "https", "mailto"},
        link_rel="noopener noreferrer",
    )


def md_to_html(md_text: str) -> str:
    return sanitize_html(_md.render(md_text))


def docx_to_html(path: Path) -> str:
    """Render a .docx file to sanitised HTML (mammoth, then nh3)."""
    if path.stat().st_size > MAX_DOCX_BYTES:
        raise ValueError("docx too large to preview")
    with path.open("rb") as f:
        return sanitize_html(mammoth.convert_to_html(f).value)


# ---- .xlsx / .pptx -------------------------------------------------------------------------------

XLSX_MAX_ROWS = 200
XLSX_MAX_COLS = 30
_e = _html.escape


def _error_html(what: str, exc: Exception) -> str:
    return sanitize_html(f"<p><strong>Could not preview this {_e(what)}:</strong> {_e(str(exc) or type(exc).__name__)}</p>")


def xlsx_to_html(path: Path) -> str:
    """Every sheet as a headed table (cached values; formula text where no cached value). Never raises."""
    wb_v = wb_f = None
    try:
        if path.stat().st_size > MAX_XLSX_BYTES:
            raise ValueError("xlsx too large to preview")
        import openpyxl
        wb_v = openpyxl.load_workbook(path, read_only=True, data_only=True)
        wb_f = openpyxl.load_workbook(path, read_only=True, data_only=False)
        parts: list[str] = []
        for name in wb_v.sheetnames:
            parts.append(f"<h2>{_e(name)}</h2>")
            rows_v = wb_v[name].iter_rows(max_row=XLSX_MAX_ROWS + 1, max_col=XLSX_MAX_COLS + 1, values_only=True)
            rows_f = wb_f[name].iter_rows(max_row=XLSX_MAX_ROWS + 1, max_col=XLSX_MAX_COLS + 1, values_only=True)
            body: list[str] = []
            truncated = False
            for i, (rv, rf) in enumerate(zip(rows_v, rows_f)):
                if i >= XLSX_MAX_ROWS:
                    truncated = True
                    break
                if len(rv) > XLSX_MAX_COLS:
                    truncated = True
                cells = [v if v is not None else f for v, f in zip(rv[:XLSX_MAX_COLS], rf[:XLSX_MAX_COLS])]
                body.append("<tr>" + "".join(f"<td>{_e('' if c is None else str(c))}</td>" for c in cells) + "</tr>")
            if body:
                parts.append("<table><tbody>" + "".join(body) + "</tbody></table>")
            else:
                parts.append("<p><em>(empty sheet)</em></p>")
            if truncated:
                parts.append(f"<p><em>Truncated: showing the first {XLSX_MAX_ROWS} rows and {XLSX_MAX_COLS} columns.</em></p>")
        return sanitize_html("".join(parts) or "<p><em>(no sheets)</em></p>")
    except Exception as e:  # noqa: BLE001 - previews never raise
        return _error_html("spreadsheet", e)
    finally:
        for wb in (wb_v, wb_f):
            try:
                if wb is not None:
                    wb.close()
            except Exception:  # noqa: BLE001
                pass


def _pptx_shape_html(shape, out: list[str]) -> None:
    from pptx.enum.shapes import MSO_SHAPE_TYPE, PP_PLACEHOLDER

    if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
        for s in shape.shapes:
            _pptx_shape_html(s, out)
        return
    if getattr(shape, "has_chart", False) and shape.has_chart:
        out.append("<p><em>[chart]</em></p>")
    elif getattr(shape, "has_table", False) and shape.has_table:
        rows = ["<tr>" + "".join(f"<td>{_e(c.text)}</td>" for c in r.cells) + "</tr>" for r in shape.table.rows]
        out.append("<table><tbody>" + "".join(rows) + "</tbody></table>")
    elif shape.shape_type == MSO_SHAPE_TYPE.PICTURE or shape.__class__.__name__ == "PlaceholderPicture":
        out.append("<p><em>[image]</em></p>")
    elif shape.has_text_frame:
        bulleted = shape.is_placeholder and shape.placeholder_format.type in (
            PP_PLACEHOLDER.BODY, PP_PLACEHOLDER.OBJECT, PP_PLACEHOLDER.VERTICAL_BODY,
        )
        items: list[str] = []

        def flush():
            if items:
                out.append("<ul>" + "".join(items) + "</ul>")
                items.clear()

        for para in shape.text_frame.paragraphs:
            text = para.text
            if not text.strip():
                continue
            if bulleted or para.level > 0:
                items.append(f"<li>{_e(text)}</li>")
            else:
                flush()
                out.append(f"<p>{_e(text)}</p>")
        flush()


def pptx_to_html(path: Path) -> str:
    """Each slide as a card: number, title, text and bullets in order, tables, [image]/[chart]
    notes and speaker notes in a quote block. Never raises."""
    try:
        if path.stat().st_size > MAX_PPTX_BYTES:
            raise ValueError("pptx too large to preview")
        from pptx import Presentation

        prs = Presentation(str(path))
        parts: list[str] = []
        for n, slide in enumerate(prs.slides, 1):
            ts = slide.shapes.title
            title = ts.text_frame.text.strip() if ts is not None and ts.has_text_frame else ""
            parts.append(f"<hr><h2>Slide {n}{': ' + _e(title) if title else ''}</h2>")
            for shape in slide.shapes:
                if ts is not None and shape.shape_id == ts.shape_id:
                    continue
                _pptx_shape_html(shape, parts)
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame is not None:
                notes = slide.notes_slide.notes_text_frame.text.strip()
                if notes:
                    parts.append(f"<blockquote><p><em>Speaker notes: {_e(notes)}</em></p></blockquote>")
        return sanitize_html("".join(parts) or "<p><em>(no slides)</em></p>")
    except Exception as e:  # noqa: BLE001 - previews never raise
        return _error_html("presentation", e)
