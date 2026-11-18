"""The user's agent workspace over HTTP: list, preview (sanitised HTML) and download."""
import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import Response

from app.agent.formats import adapter_for, md_twin
from app.agent.workspace import PathEscape, safe_path, workspace_for
from app.deps import CurrentUser

router = APIRouter(prefix="/files", tags=["files"])


def resolve(user: dict, path: str):
    """Existing, allowed file for this user: 400 escape, 404 missing, 415 unsupported type."""
    try:
        p = safe_path(user["id"], path)
    except PathEscape:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid path")
    if adapter_for(p) is None:
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
            not p.is_file() or p.is_symlink() or adapter_for(p) is None
            or any(part.startswith(".") for part in rel.parts)
        ):
            continue
        st = p.stat()
        out.append({
            "path": rel.as_posix(),
            "name": p.name,
            "size": st.st_size,
            "modified": datetime.fromtimestamp(st.st_mtime, timezone.utc).isoformat(),
            "kind": adapter_for(p).kind,
        })
    return out


@router.get("/preview")
async def preview(user: CurrentUser, path: str = Query(...)):
    p = resolve(user, path)
    # A .md with a .docx / .pdf twin previews the twin: that is what the user will download.
    if p.suffix.lower() == ".md" and (twin := md_twin(p)):
        p = twin
    ad = adapter_for(p)
    try:
        if p.stat().st_size > ad.max_bytes:
            raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large to preview")
        html = await asyncio.to_thread(ad.preview, p)
        version = str(p.stat().st_mtime_ns)
    except FileNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    return {"path": path.replace("\\", "/"), "kind": ad.kind, "html": html, "version": version}


@router.get("/download")
def download(user: CurrentUser, path: str = Query(...)):
    p = resolve(user, path)
    return Response(
        p.read_bytes(),
        media_type=adapter_for(p).mime,
        headers={"Content-Disposition": f'attachment; filename="{p.name}"'},
    )
