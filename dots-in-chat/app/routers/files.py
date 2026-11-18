"""The user's agent workspace over HTTP: list, preview (sanitised HTML) and download."""
import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

from app.agent.docx_tools import docx_to_html, md_to_html
from app.agent.workspace import (
    MAX_DOCX_BYTES, MAX_MD_BYTES, PREVIEW_EXTENSIONS, PathEscape, safe_path, workspace_for,
)
from app.deps import CurrentUser

router = APIRouter(prefix="/files", tags=["files"])

MIME = {
    ".md": "text/markdown; charset=utf-8",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def resolve(user: dict, path: str):
    """Existing, allowed file for this user: 400 escape, 404 missing, 415 unsupported type."""
    try:
        p = safe_path(user["id"], path)
    except PathEscape:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid path")
    if p.suffix.lower() not in PREVIEW_EXTENSIONS:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Unsupported file type")
    if not p.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    return p


@router.get("")
def list_files(user: CurrentUser):
    base = workspace_for(user["id"])
    out = []
    for p in sorted(base.rglob("*")):
        rel = p.relative_to(base)
        if (
            not p.is_file() or p.is_symlink() or p.suffix.lower() not in PREVIEW_EXTENSIONS
            or any(part.startswith(".") for part in rel.parts)
        ):
            continue
        st = p.stat()
        out.append({
            "path": rel.as_posix(),
            "name": p.name,
            "size": st.st_size,
            "modified": datetime.fromtimestamp(st.st_mtime, timezone.utc).isoformat(),
            "kind": p.suffix.lower().lstrip("."),
        })
    return out


@router.get("/preview")
async def preview(user: CurrentUser, path: str = Query(...)):
    p = resolve(user, path)
    ext = p.suffix.lower()
    # A .md with a .docx twin previews the twin: that is what the user will download.
    if ext == ".md" and p.with_suffix(".docx").is_file():
        p, ext = p.with_suffix(".docx"), ".docx"
    size = p.stat().st_size
    try:
        if ext == ".docx":
            if size > MAX_DOCX_BYTES:
                raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large to preview")
            html = await asyncio.to_thread(docx_to_html, p)
        else:
            if size > MAX_MD_BYTES:
                raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large to preview")
            html = md_to_html(p.read_text(encoding="utf-8", errors="replace"))
        version = str(p.stat().st_mtime_ns)
    except FileNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    return {"path": path.replace("\\", "/"), "kind": ext.lstrip("."), "html": html, "version": version}


@router.get("/download")
def download(user: CurrentUser, path: str = Query(...)):
    p = resolve(user, path)
    return Response(
        p.read_bytes(),
        media_type=MIME[p.suffix.lower()],
        headers={"Content-Disposition": f'attachment; filename="{p.name}"'},
    )
