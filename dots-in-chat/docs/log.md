# Change log

Short notes on how each change was built, newest first.

## 2026-11-19: File version history
Branch `feat/file-versions`. Every change to a workspace file, by the user or the agent, is kept
as a version that can be listed and restored. Details: [file-versions.md](file-versions.md).

How it is implemented
- **Table**: `file_versions` in the existing SQLite `data/app.db` (path, version, action, author,
  sha256, size, mtime, session and run id), created by `init_db()` in `app/db.py`.
- **Bytes**: one copy per distinct content in `<workspace>/<user>/.versions/<sha256[:2]>/<sha256>`.
  Dot-folders are already hidden from the file list and path resolver, so the store is not
  reachable through the file endpoints.
- **One chokepoint**: `record_changes()` in `app/versions.py` scans the workspace and compares each
  file with its newest version (new = created, other hash = updated, missing = deleted). Scanning
  rather than hooking each tool also catches skill scripts, which write files directly. A file with
  the same size and mtime as its newest version is not re-hashed.
- **Hooks**: before a chat run (author user) and after it, also when stopped (author agent, with the
  run id), in `app/routers/chat.py`; after a Markdown save and an upload (author user) in
  `app/routers/files.py`. A recording failure is logged and never fails the save or upload.
- **Endpoints**: `GET /files/versions`, `GET /files/versions/content`, `POST /files/versions/restore`.
  Restore writes the old bytes back as a new `restored` version, so history only grows.
- **Retention**: the last 50 versions per file; a blob is deleted only when no version uses it.
- **UI**: a History button in the file preview header (`frontend/src/features/files/VersionHistory.tsx`)
  lists versions with author, time and size, and restores one.
- **Tests**: `tests/test_versions.py`; `tests/test_files.py` now sets up a DB and users.
