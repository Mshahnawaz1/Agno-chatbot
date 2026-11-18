"""Offline tests for the file workspace: md->docx, path safety, /files endpoints, SSE file events.

Run from the repo root:  uv run pytest dots-in-chat/tests/test_files.py -q
"""
import io
import os
import sys
from pathlib import Path
from types import SimpleNamespace

os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("CONNECTOR_SECRET", "PYB0Zf4m2gHq0y1o2kZr9bq2o8n3Jx0Yq9sQeWk3m1A=")  # dummy Fernet key
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402
from docx import Document  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.agent import docx_tools, workspace  # noqa: E402
from app.agent.docx_tools import DocxTools, md_to_docx  # noqa: E402
from app.config import settings  # noqa: E402
from app.deps import get_current_user  # noqa: E402
from app.routers import files as files_router  # noqa: E402
from app.routers.chat import file_event  # noqa: E402

MD = """# Project Brief

Intro with **bold** and *italic* and `code` and [a link](https://example.com).

## Goals

- First goal
- Second goal
  - Nested goal

1. Step one
2. Step two

| Item | Cost |
| ---- | ---- |
| Dev  | 10   |

> A quote
"""


@pytest.fixture()
def ws(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "agent_workspace_dir", str(tmp_path / "ws"))
    return tmp_path


@pytest.fixture()
def client(ws):
    app = FastAPI()
    app.include_router(files_router.router)
    state = {"id": "u1"}
    app.dependency_overrides[get_current_user] = lambda: {"id": state["id"]}
    c = TestClient(app)
    c.state = state
    return c


# ---- md_to_docx ---------------------------------------------------------------------------------

def read_back(md: str):
    return Document(io.BytesIO(md_to_docx(md)))


def test_md_to_docx_structure():
    doc = read_back(MD)
    heads = [(p.style.name, p.text) for p in doc.paragraphs if p.style.name.startswith("Heading")]
    assert ("Heading 1", "Project Brief") in heads and ("Heading 2", "Goals") in heads
    intro = next(p for p in doc.paragraphs if p.text.startswith("Intro"))
    assert any(r.bold and r.text == "bold" for r in intro.runs)
    assert any(r.italic and r.text == "italic" for r in intro.runs)
    assert "https://example.com" in intro.text
    styles = {p.text: p.style.name for p in doc.paragraphs}
    assert styles["First goal"] == "List Bullet"
    assert styles["Nested goal"] == "List Bullet 2"
    assert styles["Step one"] == "List Number"
    assert styles["A quote"] == "Quote"
    assert len(doc.tables) == 1
    t = doc.tables[0]
    assert t.cell(0, 0).text == "Item" and t.cell(1, 1).text == "10"
    assert t.cell(0, 0).paragraphs[0].runs[0].bold


def test_md_to_docx_never_raises_on_odd_input():
    for md in ["", "<script>alert(1)</script>", "#### deep\n\n```\ncode\n```\n\n---\n", "| a |\n|---|\n"]:
        assert read_back(md) is not None


def test_html_is_sanitised(ws):
    p = ws / "x.docx"
    p.write_bytes(md_to_docx("# T\n\nhello"))
    assert "<h1>" in docx_tools.docx_to_html(p)
    out = docx_tools.sanitize_html('<p onclick="x()">a</p><script>alert(1)</script><a href="javascript:evil()">l</a>')
    assert "script" not in out and "onclick" not in out and "javascript" not in out
    assert "<script" not in docx_tools.md_to_html("hi <script>alert(1)</script>")


# ---- workspace / safe_path ----------------------------------------------------------------------

def test_safe_path_rejects_escapes(ws):
    workspace.workspace_for("u1")
    for bad in ["../x.md", "a/../../x.md", "/etc/passwd", "C:/Windows/x.md", "C:\\x.md", "..\\x.md",
                ".hidden.md", "d/.git/x.md", "", "a\0b.md"]:
        with pytest.raises(workspace.PathEscape):
            workspace.safe_path("u1", bad)
    assert workspace.safe_path("u1", "ok/report.md").is_relative_to(workspace.workspace_for("u1"))


def test_safe_path_rejects_other_users_dir_and_symlinks(ws):
    workspace.workspace_for("u2")
    with pytest.raises(workspace.PathEscape):
        workspace.safe_path("u1", "../u2/a.md")
    outside = ws / "secret.md"
    outside.write_text("x")
    link = workspace.workspace_for("u1") / "link.md"
    try:
        link.symlink_to(outside)
    except (OSError, NotImplementedError):
        pytest.skip("symlinks not permitted here")
    with pytest.raises(workspace.PathEscape):
        workspace.safe_path("u1", "link.md")


def test_user_id_cannot_climb(ws):
    assert workspace.workspace_for("../../evil").is_relative_to((ws / "ws").resolve())


# ---- DocxTools ----------------------------------------------------------------------------------

def test_build_and_import_docx(ws):
    base = workspace.workspace_for("u1")
    tools = DocxTools(base)
    (base / "r.md").write_text(MD, encoding="utf-8")
    assert tools.build_docx("r.md") == "r.docx"
    assert (base / "r.docx").is_file()
    assert tools.import_docx("r.docx") == "r.md"
    assert "Project Brief" in (base / "r.md").read_text(encoding="utf-8")
    assert tools.build_docx("missing.md").startswith("Error")
    assert tools.build_docx("../x.md").startswith("Error")
    assert tools.build_docx("r.md", output="r.txt").startswith("Error")
    assert tools.import_docx("/etc/passwd").startswith("Error")


# ---- /files endpoints ---------------------------------------------------------------------------

def test_auth_required(ws):
    app = FastAPI()
    app.include_router(files_router.router)
    assert TestClient(app).get("/files").status_code == 401


def seed(name="brief.md", docx=True):
    base = workspace.workspace_for("u1")
    (base / name).write_text(MD, encoding="utf-8")
    if docx:
        DocxTools(base).build_docx(name)


def test_list_preview_download(client):
    seed()
    (workspace.workspace_for("u1") / "notes.txt").write_text("nope")
    listed = client.get("/files").json()
    assert {f["path"] for f in listed} == {"brief.md", "brief.docx"}
    assert set(listed[0]) == {"path", "name", "size", "modified", "kind"}

    r = client.get("/files/preview", params={"path": "brief.docx"})
    body = r.json()
    assert r.status_code == 200 and set(body) == {"path", "kind", "html", "version"}
    assert body["kind"] == "docx" and "<h1>" in body["html"] and body["version"].isdigit()

    twin = client.get("/files/preview", params={"path": "brief.md"}).json()
    assert twin["kind"] == "docx" and twin["html"] == body["html"]

    seed("solo.md", docx=False)
    solo = client.get("/files/preview", params={"path": "solo.md"}).json()
    assert solo["kind"] == "md" and "<h1>" in solo["html"]

    d = client.get("/files/download", params={"path": "brief.docx"})
    assert d.status_code == 200
    assert "attachment" in d.headers["content-disposition"]
    assert Document(io.BytesIO(d.content)).paragraphs


def test_error_codes(client):
    seed()
    (workspace.workspace_for("u1") / "notes.txt").write_text("nope")
    assert client.get("/files/preview", params={"path": "nope.md"}).status_code == 404
    assert client.get("/files/download", params={"path": "nope.docx"}).status_code == 404
    assert client.get("/files/preview", params={"path": "../x.md"}).status_code == 400
    assert client.get("/files/preview", params={"path": "/etc/passwd"}).status_code == 400
    assert client.get("/files/download", params={"path": "..%2Fx.md"}).status_code == 400
    assert client.get("/files/preview", params={"path": "notes.txt"}).status_code == 415


def test_users_are_isolated(client):
    seed()
    client.state["id"] = "u2"
    assert client.get("/files").json() == []
    assert client.get("/files/preview", params={"path": "brief.docx"}).status_code == 404
    assert client.get("/files/preview", params={"path": "../u1/brief.docx"}).status_code == 400


def test_oversize_preview_rejected(client, monkeypatch):
    seed("big.md", docx=False)
    monkeypatch.setattr(files_router, "MAX_MD_BYTES", 10)
    assert client.get("/files/preview", params={"path": "big.md"}).status_code == 413


# ---- SSE file events ----------------------------------------------------------------------------

def tool(name, args=None, result=""):
    return SimpleNamespace(tool_name=name, tool_args=args or {}, result=result)


def test_file_events():
    seen: set = set()
    assert file_event(tool("save_file", {"file_name": "r.md"}, "r.md"), seen) == \
        {"path": "r.md", "kind": "md", "action": "created"}
    assert file_event(tool("save_file", {"file_name": "r.md"}, "r.md"), seen)["action"] == "updated"
    assert file_event(tool("replace_file_chunk", {"file_name": "r.md"}, "r.md"), seen)["action"] == "updated"
    assert file_event(tool("build_docx", {"source": "r.md"}, "r.docx"), seen) == \
        {"path": "r.docx", "kind": "docx", "action": "created"}
    assert file_event(tool("build_docx", {"source": "r.md"}, "r.docx"), seen)["action"] == "updated"
    assert file_event(tool("delete_file", {"file_name": "r.docx"}, ""), seen) == \
        {"path": "r.docx", "kind": "docx", "action": "deleted"}
    # failures and unrelated tools emit nothing
    assert file_event(tool("save_file", {"file_name": "x.md"}, "Error saving file"), seen) is None
    assert file_event(tool("build_docx", {"source": "x.md"}, "Error: x.md does not exist"), seen) is None
    assert file_event(tool("delete_file", {"file_name": "x.md"}, "Incorrect file_name"), seen) is None
    assert file_event(tool("get_weather", {"city": "x"}, "sunny"), seen) is None
