"""The user's agent workspace over HTTP: list, preview (sanitised HTML) and download."""
import asyncio
import logging
import os
import re
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.agent.doc_edit import rewrite_excerpt
from app.agent.formats import adapter_for, md_twin
from app.agent.workspace import MAX_MD_BYTES, PathEscape, rel_posix, safe_path, workspace_for
from app import versions
from app.deps import CurrentUser

logger = logging.getLogger(__name__)
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
    await asyncio.to_thread(versions.record_changes, user["id"], "user")
    return out


RAW_VIEW_KINDS = {"docx", "xlsx", "csv", "pptx", "pdf"}


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
        # Office files and PDFs are drawn in the browser from the raw file (see `file`).
        html = "" if ad.kind in RAW_VIEW_KINDS else await asyncio.to_thread(ad.preview, p)
        version = str(p.stat().st_mtime_ns)
    except FileNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "File not found")
    out = {"path": path.replace("\\", "/"), "kind": ad.kind, "html": html, "version": version}
    if ad.kind in RAW_VIEW_KINDS:
        out["file"] = rel_posix(user["id"], p)  # the file to fetch: the twin when a .md has one
    if ad.kind == "md":
        # The editor renders and edits the source itself (it needs line numbers for selections).
        out["source"] = await asyncio.to_thread(p.read_text, encoding="utf-8", errors="replace")
    return out


@router.get("/download")
def download(user: CurrentUser, path: str = Query(...)):
    p = resolve(user, path)
    return Response(
        p.read_bytes(),
        media_type=adapter_for(p).mime,
        headers={"Content-Disposition": f'attachment; filename="{p.name}"'},
    )


def editable_md(user: dict, path: str):
    """Existing Markdown file of this user; the only kind the editor may change."""
    p = resolve(user, path)
    if p.suffix.lower() != ".md":
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Only Markdown files can be edited")
    return p


def check_version(p, base_version: str | None) -> None:
    """409 when the file changed since the client loaded it (the agent or another tab edited it)."""
    if base_version is not None and base_version != str(p.stat().st_mtime_ns):
        raise HTTPException(status.HTTP_409_CONFLICT, "The file changed since you opened it. Reload and try again.")


class SaveBody(BaseModel):
    path: str
    content: str
    base_version: str | None = None


@router.put("/content")
def save_content(body: SaveBody, user: CurrentUser):
    """Save an edited Markdown file. Written to a temp name first, so a failure never truncates it."""
    p = editable_md(user, body.path)
    data = body.content.encode("utf-8")
    if len(data) > MAX_MD_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large")
    check_version(p, body.base_version)
    tmp = p.with_name(f".{p.name}.tmp")
    tmp.write_bytes(data)
    os.replace(tmp, p)
    versions.record_changes(user["id"], "user")
    return {"version": str(p.stat().st_mtime_ns)}


class AiEditBody(BaseModel):
    path: str
    start_line: int = Field(ge=1)  # 1-based, inclusive: the source lines of the blocks the user selected
    end_line: int = Field(ge=1)
    selected_text: str = Field(max_length=4000)
    instruction: str = Field(min_length=1, max_length=2000)
    base_version: str | None = None


@router.post("/ai-edit")
async def ai_edit(body: AiEditBody, user: CurrentUser):
    """Propose a rewrite of the selected lines. Nothing is written: the client shows the proposal
    and saves it through PUT /files/content if the user accepts."""
    p = editable_md(user, body.path)
    check_version(p, body.base_version)
    text = await asyncio.to_thread(p.read_text, encoding="utf-8", errors="replace")
    lines = text.split("\n")
    if body.end_line < body.start_line or body.end_line > len(lines):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Selected lines are outside the file")
    excerpt = "\n".join(lines[body.start_line - 1:body.end_line])
    try:
        replacement = await asyncio.wait_for(
            rewrite_excerpt(text, excerpt, body.selected_text, body.instruction, body.start_line, body.end_line),
            timeout=90,
        )
    except Exception:
        logger.exception("ai-edit failed")
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "The AI could not edit this part. Try again.")
    return {"replacement": replacement, "start_line": body.start_line, "end_line": body.end_line,
            "version": str(p.stat().st_mtime_ns)}


# ---- version history (app/versions.py) ----
def _rel(user: dict, path: str) -> str:
    """A safe workspace-relative path; the file itself may be gone (a deleted file has history)."""
    try:
        return rel_posix(user["id"], safe_path(user["id"], path))
    except PathEscape:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid path")


def _public(v: dict) -> dict:
    return {k: v[k] for k in ("version", "action", "author", "size", "run_id", "session_id", "created_at")}


@router.get("/versions")
def file_versions(user: CurrentUser, path: str = Query(...)):
    """Every version of a file, newest first."""
    return [_public(v) for v in versions.list_versions(user["id"], _rel(user, path))]


@router.get("/versions/content")
def version_content(user: CurrentUser, path: str = Query(...), version: int = Query(..., ge=1)):
    rel = _rel(user, path)
    got = versions.read_version(user["id"], rel, version)
    if got is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")
    ad = adapter_for(rel)
    return Response(got[1], media_type=ad.mime if ad else "application/octet-stream")


class RestoreBody(BaseModel):
    path: str
    version: int = Field(ge=1)


@router.post("/versions/restore")
def restore_version(body: RestoreBody, user: CurrentUser):
    """Put an old version back as the current file; it becomes a new version."""
    rel = _rel(user, body.path)
    if adapter_for(rel) is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Unsupported file type")
    row = versions.restore(user["id"], rel, body.version, safe_path(user["id"], rel))
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version not found")
    return _public(row)
