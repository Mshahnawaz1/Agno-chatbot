# File version history

Every change to a file in a user's workspace, by the user or the agent, is kept as a version
that can be listed and restored. Code: `app/versions.py`; table `file_versions` in `app/db.py`;
endpoints in `app/routers/files.py`; UI `frontend/src/features/files/VersionHistory.tsx`.

## Parts
- **Metadata**: SQLite table `file_versions` (same `data/app.db`): user, path, version number,
  action (created / updated / deleted / restored), author (user / agent), content hash, size,
  mtime, session and run id.
- **Bytes**: `<workspace>/<user>/.versions/<sha256[:2]>/<sha256>`, one file per distinct content.
  Dot-folders are already hidden from the file list and path resolver, so the store is not
  reachable through the file endpoints.
- **One chokepoint**: `record_changes(user, author, session, run)` scans the workspace and compares
  every file with its newest version (new file = created, other hash = updated, missing = deleted).
  Scanning instead of hooking each tool also catches skill scripts, which write files directly.
  A file whose size and mtime match its newest version is not re-hashed.

## When it runs
| Moment | Author | Where |
|---|---|---|
| Start of a chat run | user | `routers/chat.py` (edits made outside a run are not the agent's) |
| End of a chat run (also stopped runs) | agent, with the run id | `routers/chat.py` `finally` |
| Markdown save | user | `PUT /files/content` |
| Upload | user | `POST /files/upload` |
| Restore | user | `POST /files/versions/restore` |

## Endpoints
- `GET /files/versions?path=` list, newest first (works for deleted files too)
- `GET /files/versions/content?path=&version=` the bytes of one version
- `POST /files/versions/restore {path, version}` writes it back as a NEW version (history only grows)

## Rules
- Restore first records whatever is on disk, so nothing unsaved is lost.
- Retention: the last `KEEP_VERSIONS` (50) per file; a blob is deleted only when no version uses it.
- The existing `base_version` (mtime) conflict check on saves is unchanged.
- Not covered: files outside the format registry (no adapter), and changes made while no run or
  save is happening are recorded at the next hook (author "user").
