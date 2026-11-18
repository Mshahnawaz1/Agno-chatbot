"""Preview renderers for the files panel: .docx and .md to sanitised HTML.

(.html previews inject a CSP in formats.py; .pdf previews are the real file, fetched by the client.)
Documents themselves are made by skill scripts (see skill_runner.py), not here.
"""
from pathlib import Path

import mammoth
import nh3
from markdown_it import MarkdownIt

from app.agent.workspace import MAX_DOCX_BYTES

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
