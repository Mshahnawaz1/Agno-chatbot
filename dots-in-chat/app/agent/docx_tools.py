"""Markdown <-> .docx conversion and the tools that expose it to the agent.

FileTools is text-only, so the agent edits a Markdown file and `build_docx` derives the .docx.
Supported Markdown: #..### headings, paragraphs, bold, italic, `code`, bullet/numbered lists (one
nesting level), pipe tables, links (text + URL), block quotes. The rest degrades to paragraphs.
"""
import io
import logging
from pathlib import Path

import mammoth
import nh3
from agno.tools import Toolkit
from docx import Document
from docx.shared import Pt
from markdown_it import MarkdownIt

from app.agent.workspace import MAX_DOCX_BYTES, MAX_MD_BYTES, PathEscape, resolve_in

logger = logging.getLogger(__name__)

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


# ---- Markdown -> docx ---------------------------------------------------------------------------

def _add_inline(par, children) -> None:
    bold = italic = 0
    link_href: list[str] = []
    for t in children or []:
        if t.type == "strong_open":
            bold += 1
        elif t.type == "strong_close":
            bold -= 1
        elif t.type == "em_open":
            italic += 1
        elif t.type == "em_close":
            italic -= 1
        elif t.type == "link_open":
            link_href.append(dict(t.attrs).get("href", ""))
        elif t.type == "link_close":
            href = link_href.pop() if link_href else ""
            if href:
                par.add_run(f" ({href})")
        elif t.type in ("softbreak", "hardbreak"):
            par.add_run().add_break()
        elif t.type in ("text", "code_inline"):
            run = par.add_run(t.content)
            run.bold = bool(bold) or None
            run.italic = bool(italic) or None
            if t.type == "code_inline":
                run.font.name = "Courier New"
        elif t.content:
            par.add_run(t.content)


def _style(doc, name: str, fallback: str = "Normal") -> str:
    try:
        doc.styles[name]
        return name
    except KeyError:
        return fallback


def md_to_docx(md_text: str) -> bytes:
    """Convert Markdown to .docx bytes. Never raises on odd input; unknown syntax becomes text."""
    doc = Document()
    tokens = _md.parse(md_text or "")
    list_stack: list[str] = []  # "bullet" | "number"
    quote = 0
    i = 0
    n = len(tokens)
    while i < n:
        t = tokens[i]
        if t.type == "heading_open":
            par = doc.add_heading(level=min(int(t.tag[1]), 3))
            _add_inline(par, tokens[i + 1].children)
            i += 3
            continue
        if t.type in ("bullet_list_open", "ordered_list_open"):
            list_stack.append("bullet" if t.type == "bullet_list_open" else "number")
        elif t.type in ("bullet_list_close", "ordered_list_close"):
            if list_stack:
                list_stack.pop()
        elif t.type == "blockquote_open":
            quote += 1
        elif t.type == "blockquote_close":
            quote -= 1
        elif t.type == "paragraph_open":
            inline = tokens[i + 1]
            if list_stack:
                base = "List Bullet" if list_stack[-1] == "bullet" else "List Number"
                style = _style(doc, base if len(list_stack) == 1 else f"{base} 2")
            elif quote:
                style = _style(doc, "Quote")
            else:
                style = "Normal"
            par = doc.add_paragraph(style=style)
            _add_inline(par, inline.children)
            i += 3
            continue
        elif t.type in ("fence", "code_block"):
            run = doc.add_paragraph().add_run(t.content.rstrip("\n"))
            run.font.name = "Courier New"
            run.font.size = Pt(9)
        elif t.type == "table_open":
            i = _add_table(doc, tokens, i)
            continue
        i += 1
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def _add_table(doc, tokens, i: int) -> int:
    """Consume tokens from table_open to table_close; return the index after it."""
    rows: list[list[list]] = []
    header_rows = 0
    row: list[list] | None = None
    while i < len(tokens):
        t = tokens[i]
        if t.type == "tr_open":
            row = []
        elif t.type == "tr_close":
            rows.append(row or [])
            row = None
        elif t.type == "th_open":
            header_rows = 1
        elif t.type == "inline" and row is not None:
            row.append(t.children or [])
        elif t.type == "table_close":
            i += 1
            break
        i += 1
    ncols = max((len(r) for r in rows), default=0)
    if not ncols:
        return i
    table = doc.add_table(rows=len(rows), cols=ncols)
    table.style = _style(doc, "Table Grid")
    for r, cells in enumerate(rows):
        for c, children in enumerate(cells):
            par = table.cell(r, c).paragraphs[0]
            _add_inline(par, children)
            if r < header_rows:
                for run in par.runs:
                    run.bold = True
    return i


# ---- docx -> Markdown / HTML --------------------------------------------------------------------

def docx_to_md(data: bytes) -> str:
    return mammoth.convert_to_markdown(io.BytesIO(data)).value


def docx_to_html(path: Path) -> str:
    """Render a .docx file to sanitised HTML (mammoth, then nh3)."""
    if path.stat().st_size > MAX_DOCX_BYTES:
        raise ValueError("docx too large to preview")
    with path.open("rb") as f:
        return sanitize_html(mammoth.convert_to_html(f).value)


# ---- agent tools --------------------------------------------------------------------------------

class DocxTools(Toolkit):
    """Turns Markdown files into .docx files (and back) inside one user's workspace."""

    def __init__(self, base_dir: Path, **kwargs):
        self.base_dir = Path(base_dir).resolve()
        super().__init__(name="docx_tools", tools=[self.build_docx, self.import_docx], **kwargs)

    def build_docx(self, source: str, output: str | None = None) -> str:
        """Create or refresh a Word (.docx) file from a Markdown file. Call it after save_file or
        replace_file_chunk on a .md that should also exist as .docx.

        :param source: Markdown file name, e.g. "report.md".
        :param output: Optional .docx name; defaults to the source name with a .docx extension.
        :return: The .docx file name, or an error message.
        """
        try:
            src = resolve_in(self.base_dir, source)
            if src.suffix.lower() != ".md":
                return "Error: source must be a .md file"
            if not src.is_file():
                return f"Error: {source} does not exist"
            if src.stat().st_size > MAX_MD_BYTES:
                return "Error: source is too large"
            out_name = output or Path(source).with_suffix(".docx").as_posix()
            out = resolve_in(self.base_dir, out_name)
            if out.suffix.lower() != ".docx":
                return "Error: output must end in .docx"
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(md_to_docx(src.read_text(encoding="utf-8", errors="replace")))
            return out_name
        except PathEscape as e:
            return f"Error: {e}"
        except Exception as e:
            logger.exception("build_docx failed")
            return f"Error building docx: {e}"

    def import_docx(self, path: str) -> str:
        """Convert an existing .docx into an editable Markdown file next to it (same name, .md).
        Edit that file, then call build_docx.

        :param path: The .docx file name.
        :return: The .md file name, or an error message.
        """
        try:
            src = resolve_in(self.base_dir, path)
            if src.suffix.lower() != ".docx" or not src.is_file():
                return "Error: path must be an existing .docx file"
            if src.stat().st_size > MAX_DOCX_BYTES:
                return "Error: file is too large"
            md_rel = Path(path).with_suffix(".md").as_posix()
            resolve_in(self.base_dir, md_rel).write_text(docx_to_md(src.read_bytes()), encoding="utf-8")
            return md_rel
        except PathEscape as e:
            return f"Error: {e}"
        except Exception as e:
            logger.exception("import_docx failed")
            return f"Error importing docx: {e}"
