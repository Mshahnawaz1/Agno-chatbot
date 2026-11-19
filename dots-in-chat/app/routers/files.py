"""The user's agent workspace over HTTP: list, preview (sanitised HTML) and download."""
import asyncio
import re
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

from app.agent.formats import adapter_for, md_twin
from app.agent.workspace import PathEscape, safe_path, workspace_for
from app.deps import CurrentUser

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = "uploads"  # uploads live in the workspace, in their own folder, beside generated files
MAX_UPLOADS_PER_REQUEST = 10
_BAD_NAME_CHARS = re.compile(r"[^\w.\- ()]")


def clean_name(raw: str | None) -> str:
    """A bare, visible file name: no folders, no hidden names, no odd characters."""
    name = (raw or "").replace("\\", "/").split("/")[-1].strip()
    name = _BAD_NAME_CHARS.sub("_", name).lstrip(". ")
    return name or "upload"


def free_path(folder: Path, name: str) -> Path:
    """`name`, or `name (1)`, `name (2)`... so an upload never overwrites an existing file."""
    p = folder / name
    stem, suffix, n = Path(name).stem, Path(name).suffix, 0
    while p.exists():
        n += 1
        p = folder / f"{stem} ({n}){suffix}"
    return p


def origin_of(rel: Path) -> str:
    return "uploaded" if rel.parts and rel.parts[0] == UPLOAD_DIR else "generated"


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
            "origin": origin_of(rel),
        })
    return out


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload(user: CurrentUser, files: list[UploadFile]):
    """Save documents into the user's workspace (`uploads/`). Same types and size limits as previews.
    All-or-nothing on validation: one bad file rejects the request before anything is written."""
    if not files:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No files")
    if len(files) > MAX_UPLOADS_PER_REQUEST:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"At most {MAX_UPLOADS_PER_REQUEST} files at once")
    staged: list[tuple[str, bytes]] = []
    for f in files:
        name = clean_name(f.filename)
        ad = adapter_for(name)
        if ad is None:
            raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"{name}: unsupported file type")
        data = await f.read(ad.max_bytes + 1)  # never buffer more than the limit
        if len(data) > ad.max_bytes:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                f"{name}: larger than {ad.max_bytes // (1024 * 1024)} MB",
            )
        if not data:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"{name}: file is empty")
        staged.append((name, data))
    base = workspace_for(user["id"])
    folder = base / UPLOAD_DIR
    folder.mkdir(exist_ok=True)
    out = []
    for name, data in staged:
        p = free_path(folder, name)
        p.write_bytes(data)
        out.append({
            "path": p.relative_to(base).as_posix(), "name": p.name, "size": len(data),
            "modified": datetime.fromtimestamp(p.stat().st_mtime, timezone.utc).isoformat(),
            "kind": adapter_for(p).kind, "origin": "uploaded",
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
