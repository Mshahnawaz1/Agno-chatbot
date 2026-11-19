"""Version history for the files in a user's workspace.

How it works
- Every change to a workspace file (by the user or the agent) becomes a row in `file_versions`
  (app/db.py): path, version number, author, action, content hash, and the chat run behind it.
- The bytes are stored once per distinct content in `<workspace>/.versions/<sha256[:2]>/<sha256>`.
  The workspace's listing and path resolver already hide dot-folders, so the store is unreachable
  from the file endpoints.
- `record_changes` is the single chokepoint. It scans the workspace and compares it with each
  path's newest version: a new file is `created`, a different hash `updated`, a missing file
  `deleted`. Scanning (not hooking each tool) also catches skill scripts, which write files
  directly. A file whose size and mtime match its newest version is not re-hashed.
- Callers: before and after an agent run (chat.py: before = author "user", so edits made outside
  a run are not credited to the agent; after = "agent"), after a user's save and after uploads
  (routers/files.py).
- Restoring writes an old version's bytes back and records a new `restored` version, so history
  only ever grows (until retention prunes the oldest versions and any blob nothing references).
"""
import hashlib
import logging
import os
import threading
from pathlib import Path

from app import db
from app.agent.formats import adapter_for
from app.agent.workspace import workspace_for

logger = logging.getLogger(__name__)

STORE = ".versions"
KEEP_VERSIONS = 50  # per file; older ones are pruned
_locks: dict[str, threading.Lock] = {}
_locks_guard = threading.Lock()


def _lock(user_id: str) -> threading.Lock:
    with _locks_guard:
        return _locks.setdefault(user_id, threading.Lock())


def _blob(base: Path, sha: str) -> Path:
    return base / STORE / sha[:2] / sha


def _hash(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _visible_files(base: Path) -> dict[str, Path]:
    """The workspace files that have a format adapter, minus hidden folders (so minus the store)."""
    out: dict[str, Path] = {}
    for p in base.rglob("*"):
        rel = p.relative_to(base)
        if p.is_symlink() or not p.is_file() or any(part.startswith(".") for part in rel.parts):
            continue
        if adapter_for(p) is not None:
            out[rel.as_posix()] = p
    return out


def _store(base: Path, src: Path, sha: str) -> None:
    dest = _blob(base, sha)
    if dest.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_name(f".{dest.name}.tmp")
    tmp.write_bytes(src.read_bytes())
    os.replace(tmp, dest)


def record_changes(user_id: str, author: str, session_id: str | None = None,
                   run_id: str | None = None) -> list[dict]:
    """Record every workspace change since each file's newest version. Returns the new rows."""
    base = workspace_for(user_id)
    made: list[dict] = []
    with _lock(user_id):
        latest = db.latest_file_versions(user_id)
        files = _visible_files(base)
        for rel, p in sorted(files.items()):
            st = p.stat()
            last = latest.get(rel)
            if last and last["sha256"] and last["size"] == st.st_size and last["mtime_ns"] == st.st_mtime_ns:
                continue
            sha = _hash(p)
            if last and last["sha256"] == sha:
                continue  # touched, not changed
            _store(base, p, sha)
            action = "updated" if last and last["sha256"] else "created"
            made.append(db.add_file_version(user_id, rel, action, author, sha, st.st_size,
                                            st.st_mtime_ns, session_id, run_id))
        for rel, last in latest.items():
            if last["sha256"] and rel not in files:
                made.append(db.add_file_version(user_id, rel, "deleted", author, None, 0, 0,
                                                session_id, run_id))
        for row in made:
            _prune(user_id, base, row["path"])
    if made:
        logger.debug("versions: user=%s author=%s recorded %d change(s)", user_id, author, len(made))
    return made


def _prune(user_id: str, base: Path, path: str) -> None:
    rows = db.list_file_versions(user_id, path)
    if len(rows) <= KEEP_VERSIONS:
        return
    db.delete_file_versions(user_id, path, rows[KEEP_VERSIONS - 1]["version"])
    keep = db.referenced_hashes(user_id)
    for sha in {r["sha256"] for r in rows[KEEP_VERSIONS:] if r["sha256"]} - keep:
        _blob(base, sha).unlink(missing_ok=True)


def list_versions(user_id: str, path: str) -> list[dict]:
    return db.list_file_versions(user_id, path)


def read_version(user_id: str, path: str, version: int) -> tuple[dict, bytes] | None:
    """The version row and its bytes; None if there is no such version or it has no content."""
    row = db.get_file_version(user_id, path, version)
    if row is None or not row["sha256"]:
        return None
    blob = _blob(workspace_for(user_id), row["sha256"])
    return (row, blob.read_bytes()) if blob.is_file() else None


def restore(user_id: str, path: str, version: int, target: Path,
            session_id: str | None = None) -> dict | None:
    """Write version `version` back to `target` (the resolved workspace path) as a new version."""
    got = read_version(user_id, path, version)
    if got is None:
        return None
    _, data = got
    record_changes(user_id, "user")  # whatever is on disk now is kept in history first
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_name(f".{target.name}.tmp")
    tmp.write_bytes(data)
    os.replace(tmp, target)
    record_changes(user_id, "user", session_id)
    newest = db.list_file_versions(user_id, path)[0]
    if newest["action"] != "deleted":
        db.set_file_version_action(user_id, path, newest["version"], "restored")
        newest["action"] = "restored"
    return newest
