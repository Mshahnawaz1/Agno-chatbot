"""Per-user file workspace: where the agent's files live and the one path resolver the HTTP layer uses."""
import re
from pathlib import Path

from app.config import settings

MAX_MD_BYTES = 2 * 1024 * 1024
MAX_DOCX_BYTES = 10 * 1024 * 1024
MAX_HTML_BYTES = 2 * 1024 * 1024
MAX_PDF_BYTES = 25 * 1024 * 1024  # the knowledge-base report is 15 MB; the viewer loads the whole file
MAX_XLSX_BYTES = 10 * 1024 * 1024
MAX_PPTX_BYTES = 10 * 1024 * 1024
_SAFE_ID = re.compile(r"[^A-Za-z0-9_.-]")
APP_ROOT = Path(__file__).resolve().parents[2]  # dots-in-chat/: relative settings are anchored here, not to the cwd


class PathEscape(ValueError):
    """The path leaves the user's workspace (or is absolute, hidden, or otherwise not allowed)."""


def workspace_for(user_id: str) -> Path:
    """`<workspace root>/<user_id>/`, created on demand. The id is sanitised so it cannot climb."""
    name = _SAFE_ID.sub("_", str(user_id)).lstrip(".") or "_"
    root = Path(settings.agent_workspace_dir)
    path = ((root if root.is_absolute() else APP_ROOT / root) / name).resolve()
    path.mkdir(parents=True, exist_ok=True)
    return path


def resolve_in(base: Path, rel: str) -> Path:
    """Resolve `rel` inside `base`. Raises PathEscape on absolute paths, `..`, hidden names, NULs
    and symlinks that point outside `base`."""
    if not rel or "\0" in rel:
        raise PathEscape("empty or invalid path")
    rel = rel.replace("\\", "/")
    p = Path(rel)
    if p.is_absolute() or rel.startswith("/") or p.drive or re.match(r"^[A-Za-z]:", rel):
        raise PathEscape("absolute paths are not allowed")
    parts = [x for x in rel.split("/") if x not in ("", ".")]
    if not parts or any(x == ".." or x.startswith(".") for x in parts):
        raise PathEscape("path not allowed")
    base = base.resolve()
    target = (base / Path(*parts)).resolve()  # follows symlinks
    if not target.is_relative_to(base):
        raise PathEscape("path escapes the workspace")
    return target


def safe_path(user_id: str, rel: str) -> Path:
    return resolve_in(workspace_for(user_id), rel)


def rel_posix(user_id: str, path: Path) -> str:
    return path.relative_to(workspace_for(user_id)).as_posix()


def is_allowed_ext(path: Path | str) -> bool:
    """Allow-list for preview/download/listing: the extensions in the format registry."""
    from app.agent.formats import adapter_for  # lazy: formats imports this module's constants
    return adapter_for(path) is not None
