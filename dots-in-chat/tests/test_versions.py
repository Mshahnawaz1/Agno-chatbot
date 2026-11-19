"""Offline tests for file version history (app/versions.py and the /files/versions endpoints).

Run from dots-in-chat/:  uv run --with pytest python -m pytest tests/test_versions.py -q
"""
import os
import sys
import tempfile
from pathlib import Path

os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("CONNECTOR_SECRET", "PYB0Zf4m2gHq0y1o2kZr9bq2o8n3Jx0Yq9sQeWk3m1A=")
os.environ["APP_DB_PATH"] = os.path.join(tempfile.mkdtemp(), "app.db")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import db, versions  # noqa: E402
from app.agent.workspace import workspace_for  # noqa: E402
from app.config import settings  # noqa: E402
from app.deps import get_current_user  # noqa: E402
from app.routers import files as files_router  # noqa: E402

db.init_db()


@pytest.fixture()
def user(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "agent_workspace_dir", str(tmp_path / "ws"))
    return db.create_user(f"u{os.urandom(4).hex()}@x.io", None, "hash")


@pytest.fixture()
def client(user):
    app = FastAPI()
    app.include_router(files_router.router)
    app.dependency_overrides[get_current_user] = lambda: {"id": user["id"]}
    return TestClient(app)


def write(user, rel, text):
    p = workspace_for(user["id"]) / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    return p


def test_create_update_delete_are_recorded_with_authors(user):
    uid = user["id"]
    p = write(user, "a.md", "one")
    assert [(r["action"], r["author"]) for r in versions.record_changes(uid, "user")] == [("created", "user")]
    assert versions.record_changes(uid, "agent") == []  # nothing changed: no new version
    p.write_text("two", encoding="utf-8")
    assert [(r["action"], r["author"], r["version"]) for r in versions.record_changes(uid, "agent", "s1", "r1")] == [("updated", "agent", 2)]
    p.unlink()
    assert [r["action"] for r in versions.record_changes(uid, "user")] == ["deleted"]
    assert [v["action"] for v in versions.list_versions(uid, "a.md")] == ["deleted", "updated", "created"]


def test_touching_without_changing_makes_no_version(user):
    uid = user["id"]
    p = write(user, "a.md", "same")
    versions.record_changes(uid, "user")
    p.write_text("same", encoding="utf-8")  # new mtime, same bytes
    assert versions.record_changes(uid, "user") == []


def test_identical_content_is_stored_once_and_store_is_hidden(user):
    uid = user["id"]
    write(user, "a.md", "dup")
    write(user, "b.md", "dup")
    versions.record_changes(uid, "user")
    blobs = [p for p in (workspace_for(uid) / versions.STORE).rglob("*") if p.is_file()]
    assert len(blobs) == 1
    assert all(not v["path"].startswith(".") for p in ("a.md", "b.md") for v in versions.list_versions(uid, p))


def test_restore_is_a_new_version_and_keeps_the_overwritten_one(user):
    uid = user["id"]
    p = write(user, "a.md", "v1")
    versions.record_changes(uid, "user")
    p.write_text("v2 by agent", encoding="utf-8")
    versions.record_changes(uid, "agent")
    row = versions.restore(uid, "a.md", 1, p)
    assert p.read_text(encoding="utf-8") == "v1" and row["version"] == 3 and row["author"] == "user" and row["action"] == "restored"
    assert versions.read_version(uid, "a.md", 2)[1] == b"v2 by agent"


def test_restore_records_unsaved_disk_state_first(user):
    uid = user["id"]
    p = write(user, "a.md", "v1")
    versions.record_changes(uid, "user")
    p.write_text("unrecorded edit", encoding="utf-8")
    versions.restore(uid, "a.md", 1, p)
    assert [v["version"] for v in versions.list_versions(uid, "a.md")] == [3, 2, 1]
    assert versions.read_version(uid, "a.md", 2)[1] == b"unrecorded edit"


def test_retention_prunes_old_versions_and_orphan_blobs(user, monkeypatch):
    monkeypatch.setattr(versions, "KEEP_VERSIONS", 3)
    uid = user["id"]
    p = write(user, "a.md", "0")
    versions.record_changes(uid, "user")
    for i in range(1, 6):
        p.write_text(str(i), encoding="utf-8")
        versions.record_changes(uid, "user")
    assert [v["version"] for v in versions.list_versions(uid, "a.md")] == [6, 5, 4]
    blobs = [x for x in (workspace_for(uid) / versions.STORE).rglob("*") if x.is_file()]
    assert len(blobs) == 3


def test_endpoints_list_download_restore_and_save_records(client, user):
    r = client.post("/files/upload", files=[("files", ("n.md", b"first", "text/markdown"))])
    assert r.status_code == 201
    assert client.put("/files/content", json={"path": "uploads/n.md", "content": "second"}).status_code == 200
    vs = client.get("/files/versions", params={"path": "uploads/n.md"}).json()
    assert [(v["version"], v["action"], v["author"]) for v in vs] == [(2, "updated", "user"), (1, "created", "user")]
    assert client.get("/files/versions/content", params={"path": "uploads/n.md", "version": 1}).content == b"first"
    assert client.post("/files/versions/restore", json={"path": "uploads/n.md", "version": 1}).json()["version"] == 3
    assert client.get("/files/download", params={"path": "uploads/n.md"}).content == b"first"
    assert client.get("/files/versions/content", params={"path": "uploads/n.md", "version": 99}).status_code == 404
    assert client.get("/files/versions", params={"path": "../x"}).status_code == 400
