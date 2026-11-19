# Change log

Short notes on how each change was built, newest first.

## 2026-11-19: Artifacts page restyle and file previews
Card grid like the Library reference; each card shows the first page of its file.
The connectors page got a plugin-style list with company logos (`public/connectors/`).

How the preview works (`frontend/src/features/files/FileThumb.tsx`)
- **Client side, no thumbnail image.** The real file is rendered at 800x1000, scaled down with a CSS
  transform to the card width, and clipped by the card, so only the top (page one) shows.
- **Per kind**: md/html: `/files/preview` HTML in a sandboxed iframe (md wrapped by `pageDoc.ts`);
  pdf: blob in an iframe with `#page=1&toolbar=0`; docx/xlsx/csv/pptx: `OfficeView`, scaled.
- **Cost control**: a card loads only when it scrolls near view (IntersectionObserver); the preview
  is `inert`; the kind's icon shows until it paints or if it fails.

TODO: change to thumbnail based. Every visible card runs a full viewer (heaviest for Office files,
2 requests per card, nothing cached across visits), and Office previews may show viewer chrome.
Instead render page 1 to a small PNG on the server when a file is saved (e.g. LibreOffice / a PDF
renderer, stored next to the version blobs), serve it from an endpoint, and make the card an `<img>`.
- Add pagination for this page.

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

## 2026-11-19: Fixing black screen
The UI goes dark when I search the artifacts using @ and press the down button. It loads back to the original when I refresh the page.

Fixed the black screen and committed it as 3d12804. I reproduced the crash in a real browser (Playwright, API mocked) and confirmed the fix there.

Cause
- The @ menu had a line that scrolled the highlighted row into view: useEffect(() => activeEl.current?.scrollIntoView(...)).
- That arrow function returned whatever scrollIntoView returned, and in this Chromium that is a Promise. React treats an effect's return value as its clean-up function, so the next ArrowDown threw destroy is not a function.
- React then unmounted the whole app, which looked like a black screen. A refresh restored it because the page state was rebuilt from scratch.

Fix
- The menu now scrolls its own list element directly (MentionMenu.tsx), with no return value.
- This also removes a second risk: scrollIntoView can scroll the page's overflow-hidden ancestors and push the chat window out of view.