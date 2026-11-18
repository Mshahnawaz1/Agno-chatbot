"""Format adapter registry: one entry per previewable file type (.md .docx .html .pdf .xlsx .pptx).

The files router and the workspace allow-list read from here, so a new format is one adapter.
`kind` is the value sent to the client (preview + SSE); `preview(path)` returns the `html` field.
"""
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from app.agent.previews import docx_to_html, md_to_html, pptx_to_html, xlsx_to_html
from app.agent.workspace import MAX_DOCX_BYTES, MAX_HTML_BYTES, MAX_MD_BYTES, MAX_PDF_BYTES, MAX_PPTX_BYTES, MAX_XLSX_BYTES

HTML_CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:"
_CSP_META = f'<meta http-equiv="Content-Security-Policy" content="{HTML_CSP}">'
_HEAD_OPEN = re.compile(r"<head(\s[^>]*)?>", re.I)
_HTML_OPEN = re.compile(r"<html(\s[^>]*)?>", re.I)
_DOCTYPE = re.compile(r"^\s*<!doctype[^>]*>", re.I)


def inject_csp(doc: str) -> str:
    """Put the CSP meta first in <head>. Never sanitises (that would strip the agent's <style>).
    Handles documents with no <head>, no <html>, or neither (fragments)."""
    if m := _HEAD_OPEN.search(doc):
        return doc[:m.end()] + _CSP_META + doc[m.end():]
    if m := _HTML_OPEN.search(doc):
        return doc[:m.end()] + f"<head>{_CSP_META}</head>" + doc[m.end():]
    head = f"<head>{_CSP_META}</head>"
    if m := _DOCTYPE.match(doc):
        return doc[:m.end()] + f"<html>{head}<body>{doc[m.end():]}</body></html>"
    return f"<!doctype html><html>{head}<body>{doc}</body></html>"


def _preview_docx(p: Path) -> str:
    return docx_to_html(p)


def _preview_md(p: Path) -> str:
    return md_to_html(p.read_text(encoding="utf-8", errors="replace"))


def _preview_html(p: Path) -> str:
    return inject_csp(p.read_text(encoding="utf-8", errors="replace"))


def _preview_xlsx(p: Path) -> str:
    return xlsx_to_html(p)


def _preview_pptx(p: Path) -> str:
    return pptx_to_html(p)


def _preview_pdf(p: Path) -> str:
    return ""  # the client fetches /files/download and shows the real PDF


@dataclass(frozen=True)
class Adapter:
    ext: str
    kind: str
    mime: str
    max_bytes: int
    preview: Callable[[Path], str]
    twin_priority: int = 0  # for a .md twin: the highest-priority existing sibling wins (0 = never)


ADAPTERS: dict[str, Adapter] = {a.ext: a for a in [
    Adapter(".md", "md", "text/markdown; charset=utf-8", MAX_MD_BYTES, _preview_md),
    Adapter(".docx", "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            MAX_DOCX_BYTES, _preview_docx, twin_priority=2),
    Adapter(".html", "html", "text/html; charset=utf-8", MAX_HTML_BYTES, _preview_html),
    Adapter(".pdf", "pdf", "application/pdf", MAX_PDF_BYTES, _preview_pdf, twin_priority=1),
    Adapter(".xlsx", "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            MAX_XLSX_BYTES, _preview_xlsx),
    Adapter(".pptx", "pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            MAX_PPTX_BYTES, _preview_pptx),
]}


def adapter_for(path: Path | str) -> Adapter | None:
    return ADAPTERS.get(Path(str(path)).suffix.lower())


def kind_for(path: str) -> str:
    a = adapter_for(path)
    return a.kind if a else "file"


def md_twin(md_path: Path) -> Path | None:
    """The derived file (.docx wins over .pdf) sitting next to a .md, if any."""
    twins = sorted(
        (a for a in ADAPTERS.values() if a.twin_priority and md_path.with_suffix(a.ext).is_file()),
        key=lambda a: -a.twin_priority,
    )
    return md_path.with_suffix(twins[0].ext) if twins else None
