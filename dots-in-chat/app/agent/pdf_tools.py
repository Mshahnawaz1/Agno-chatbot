"""Markdown -> .pdf (xhtml2pdf, pure Python) and .pdf -> text (pypdf), exposed as agent tools.

Same pattern as docx: the agent edits a `.md` and `build_pdf` derives the `.pdf`. Markdown is
parsed with the same markdown-it setup as the docx converter; raw HTML in the source is escaped.
"""
import html
import io
import logging
from pathlib import Path

from agno.tools import Toolkit
from markdown_it import MarkdownIt
from pypdf import PdfReader
from xhtml2pdf import pisa

from app.agent.workspace import MAX_MD_BYTES, MAX_PDF_BYTES, PathEscape, resolve_in

logger = logging.getLogger(__name__)

# Same dialect as docx_tools, minus images: xhtml2pdf would fetch remote URLs (SSRF).
_md = MarkdownIt("commonmark", {"html": False}).enable("table").disable("image")
MAX_READ_CHARS = 100_000

PDF_CSS = """
@page { size: A4; margin: 2cm 2cm 2.2cm 2cm; }
body { font-family: Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: #1a1a1a; }
h1 { font-size: 22pt; margin: 0 0 10pt 0; padding-bottom: 4pt; border-bottom: 1px solid #999; }
h2 { font-size: 16pt; margin: 16pt 0 6pt 0; }
h3 { font-size: 13pt; margin: 12pt 0 4pt 0; }
h4, h5, h6 { font-size: 11pt; margin: 10pt 0 4pt 0; }
p { margin: 0 0 8pt 0; }
ul, ol { margin: 0 0 8pt 0; }
li { margin-bottom: 2pt; }
a { color: #1a56b0; text-decoration: underline; }
blockquote { margin: 6pt 0 8pt 12pt; padding-left: 8pt; border-left: 3px solid #bbb; color: #444; }
code { font-family: Courier, monospace; font-size: 9.5pt; background-color: #f1f1f1; }
pre { font-family: Courier, monospace; font-size: 9pt; background-color: #f1f1f1; padding: 6pt; border: 1px solid #ddd; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0 10pt 0; }
th, td { border: 1px solid #888; padding: 4pt 6pt; text-align: left; vertical-align: top; }
th { background-color: #e8e8e8; font-weight: bold; }
hr { border: 0; border-top: 1px solid #bbb; }
"""


def _no_external(uri, rel):
    """xhtml2pdf link_callback: only data: URIs may load; anything else is refused."""
    return uri if str(uri).startswith("data:") else None


def md_to_pdf(md_text: str) -> bytes:
    """Markdown to PDF bytes. Raises RuntimeError if rendering fails."""
    body = _md.render(md_text or "")
    doc = f"<html><head><meta charset='utf-8'><style>{PDF_CSS}</style></head><body>{body}</body></html>"
    buf = io.BytesIO()
    result = pisa.CreatePDF(doc, dest=buf, encoding="utf-8", link_callback=_no_external)
    if result.err:
        raise RuntimeError(f"PDF renderer reported {result.err} error(s)")
    return buf.getvalue()


def pdf_to_text(data: bytes, max_chars: int = MAX_READ_CHARS) -> str:
    reader = PdfReader(io.BytesIO(data))
    out: list[str] = []
    total = 0
    for i, page in enumerate(reader.pages, 1):
        text = (page.extract_text() or "").strip()
        out.append(f"--- page {i} ---\n{text}")
        total += len(text)
        if total > max_chars:
            out.append("[truncated]")
            break
    return "\n\n".join(out)[:max_chars + 50]


class PdfTools(Toolkit):
    """Build PDFs from Markdown and read PDFs, inside one user's workspace."""

    def __init__(self, base_dir: Path, **kwargs):
        self.base_dir = Path(base_dir).resolve()
        super().__init__(name="pdf_tools", tools=[self.build_pdf, self.read_pdf], **kwargs)

    def build_pdf(self, source: str, output: str = "") -> str:
        """Create or refresh a PDF from a Markdown file. Call it after save_file or
        replace_file_chunk on a .md that should also exist as .pdf.

        :param source: Markdown file name, e.g. "report.md".
        :param output: Optional .pdf name; defaults to the source name with a .pdf extension.
        :return: The .pdf file name, or a message starting with "Error".
        """
        try:
            src = resolve_in(self.base_dir, source)
            if src.suffix.lower() != ".md":
                return "Error: source must be a .md file"
            if not src.is_file():
                return f"Error: {source} does not exist"
            if src.stat().st_size > MAX_MD_BYTES:
                return "Error: source is too large"
            out_name = (output or "").strip() or Path(source).with_suffix(".pdf").as_posix()
            out = resolve_in(self.base_dir, out_name)
            if out.suffix.lower() != ".pdf":
                return "Error: output must end in .pdf"
            data = md_to_pdf(src.read_text(encoding="utf-8", errors="replace"))
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(data)
            return out_name.replace("\\", "/")
        except PathEscape as e:
            return f"Error: {e}"
        except Exception as e:
            logger.exception("build_pdf failed")
            return f"Error building pdf: {e}"

    def read_pdf(self, path: str) -> str:
        """Extract the text of a PDF (one section per page). To edit a PDF, read it, rewrite the
        content as Markdown with save_file, then call build_pdf (layout is not preserved).

        :param path: The .pdf file name.
        :return: The text, or a message starting with "Error".
        """
        try:
            src = resolve_in(self.base_dir, path)
            if src.suffix.lower() != ".pdf" or not src.is_file():
                return "Error: path must be an existing .pdf file"
            if src.stat().st_size > MAX_PDF_BYTES:
                return "Error: file is too large"
            return pdf_to_text(src.read_bytes()) or "(no extractable text)"
        except PathEscape as e:
            return f"Error: {e}"
        except Exception as e:
            logger.exception("read_pdf failed")
            return f"Error reading pdf: {html.escape(str(e))}"
