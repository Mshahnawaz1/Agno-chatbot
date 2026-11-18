"""Offline tests for the file workspace: previews, path safety, /files endpoints, SSE file events,
and the FileTools binary-write guard. (Skill scripts and the runner: test_skill_runner.py.)

Run from the repo root:  uv run pytest dots-in-chat/tests/test_files.py -q
"""
import io
import json
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

from app.agent import formats, previews, workspace  # noqa: E402
from app.agent.file_guard import WorkspaceFileTools  # noqa: E402
from app.config import settings  # noqa: E402
from app.deps import get_current_user  # noqa: E402
from app.routers import files as files_router  # noqa: E402
from app.routers.chat import file_events  # noqa: E402

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


# ---- previews -----------------------------------------------------------------------------------

def make_docx(path: Path) -> None:
    """A small .docx (heading, bullet, table) made with python-docx, like the skill scripts do."""
    doc = Document()
    doc.add_heading("Project Brief", level=1)
    doc.add_paragraph("First goal", style="List Bullet")
    t = doc.add_table(rows=2, cols=2)
    t.cell(0, 0).text, t.cell(1, 1).text = "Item", "10"
    doc.save(path)


def make_pdf(path: Path, text: str = "Project Brief") -> None:
    from reportlab.pdfgen import canvas
    c = canvas.Canvas(str(path))
    c.drawString(72, 720, text)
    c.save()


def test_html_is_sanitised(ws):
    p = ws / "x.docx"
    make_docx(p)
    html = previews.docx_to_html(p)
    assert "<h1>" in html and "<table>" in html and "<li>" in html
    out = previews.sanitize_html('<p onclick="x()">a</p><script>alert(1)</script><a href="javascript:evil()">l</a>')
    assert "script" not in out and "onclick" not in out and "javascript" not in out
    assert "<script" not in previews.md_to_html("hi <script>alert(1)</script>")
    assert "<h1>" in previews.md_to_html(MD) and "<table>" in previews.md_to_html(MD)


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


# ---- /files endpoints ---------------------------------------------------------------------------

def test_auth_required(ws):
    app = FastAPI()
    app.include_router(files_router.router)
    assert TestClient(app).get("/files").status_code == 401


def seed(name="brief.md", docx=True):
    base = workspace.workspace_for("u1")
    (base / name).write_text(MD, encoding="utf-8")
    if docx:
        make_docx(base / Path(name).with_suffix(".docx"))


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
    from dataclasses import replace
    monkeypatch.setitem(formats.ADAPTERS, ".md", replace(formats.ADAPTERS[".md"], max_bytes=10))
    assert client.get("/files/preview", params={"path": "big.md"}).status_code == 413


# ---- SSE file events ----------------------------------------------------------------------------

def tool(name, args=None, result=""):
    return SimpleNamespace(tool_name=name, tool_args=args or {}, result=result)


def one(t, seen):
    events = file_events(t, seen)
    assert len(events) <= 1, events
    return events[0] if events else None


def test_file_events():
    seen: set = set()
    assert one(tool("save_file", {"file_name": "r.md"}, "r.md"), seen) == \
        {"path": "r.md", "kind": "md", "action": "created"}
    assert one(tool("save_file", {"file_name": "r.md"}, "r.md"), seen)["action"] == "updated"
    assert one(tool("replace_file_chunk", {"file_name": "r.md"}, "r.md"), seen)["action"] == "updated"
    assert one(tool("delete_file", {"file_name": "r.docx"}, ""), seen) == \
        {"path": "r.docx", "kind": "docx", "action": "deleted"}
    assert one(tool("save_file", {"file_name": "sub\\p.html"}, "sub\\p.html"), seen)["path"] == "sub/p.html"
    # failures, non-previewable files (a JSON spec), refused binary writes and unrelated tools: nothing
    assert one(tool("save_file", {"file_name": "x.md"}, "Error saving file"), seen) is None
    assert one(tool("save_file", {"file_name": "spec.json"}, "spec.json"), seen) is None
    assert one(tool("save_file", {"file_name": "x.docx"}, "Error: refusing to write"), seen) is None
    assert one(tool("delete_file", {"file_name": "x.md"}, "Incorrect file_name"), seen) is None
    assert one(tool("delete_file", {"file_name": "spec.json"}, ""), seen) is None
    assert one(tool("get_weather", {"city": "x"}, "sunny"), seen) is None
    assert one(tool("build_docx", {"source": "r.md"}, "r.docx"), seen) is None  # removed tool


def test_run_skill_script_events():
    seen: set = set()
    result = json.dumps({"ok": True, "exit_code": 0, "stdout": "", "stderr": "", "changed": [
        {"path": "out.docx", "action": "created", "kind": "docx"},
        {"path": "r/out.pdf", "action": "updated", "kind": "pdf"},
        {"path": "old.md", "action": "deleted", "kind": "md"},
        {"path": "spec.json", "action": "created", "kind": "file"},
        {"path": "x.png", "action": "created", "kind": "file"},
        {"path": "bad.docx", "action": "exploded", "kind": "docx"},
    ]})
    events = file_events(tool("run_skill_script", {"skill": "microsoft-office"}, result), seen)
    assert events == [
        {"path": "out.docx", "kind": "docx", "action": "created"},
        {"path": "r/out.pdf", "kind": "pdf", "action": "updated"},
        {"path": "old.md", "kind": "md", "action": "deleted"},
    ]
    assert "out.docx" in seen and "old.md" not in seen
    failed = json.dumps({"ok": False, "exit_code": 1, "stdout": "", "stderr": "boom", "changed": []})
    for r in [failed, "not json", "", "[1, 2]", json.dumps({"changed": "nope"})]:
        assert file_events(tool("run_skill_script", {}, r), seen) == []


# ---- binary-write guard -------------------------------------------------------------------------

def test_file_tools_refuse_binary_writes(ws):
    base = workspace.workspace_for("u1")
    ft = WorkspaceFileTools(base_dir=base, enable_delete_file=True)
    for name in ["r.docx", "R.PDF", "sub/x.xlsx", "img.png"]:
        r = ft.save_file("PK fake", name)
        assert r.startswith("Error") and "run_skill_script" in r, r
        assert not (base / name).exists()
    assert "docx_create" in ft.save_file("x", "r.docx") and "pdf_create" in ft.save_file("x", "r.pdf")
    assert ft.save_file("# hi\n", "r.md") == "r.md" and (base / "r.md").read_text() == "# hi\n"
    assert ft.save_file("<p>x</p>", "p.html") == "p.html"
    assert ft.save_file("{}", "spec.json") == "spec.json"
    # replace_file_chunk writes through save_file, so it is guarded too
    make_pdf(base / "d.pdf")
    before = (base / "d.pdf").read_bytes()
    assert ft.replace_file_chunk("d.pdf", 0, 0, "x").startswith("Error")
    assert (base / "d.pdf").read_bytes() == before
    # reading a binary points at the read scripts
    assert "docx_read" in ft.read_file("a.docx") and "pdf_read" in ft.read_file("d.pdf")
    assert ft.read_file("r.md") == "# hi\n"
    # the agent still sees the stock tool names
    assert {"save_file", "read_file", "replace_file_chunk"} <= set(ft.functions)


# ---- v2: html + pdf -----------------------------------------------------------------------------

HTML_DOC = "<!doctype html><html><head><title>T</title><style>h1{color:red}</style></head><body><h1>Hi</h1><script>alert(1)</script></body></html>"


def test_inject_csp_variants():
    out = formats.inject_csp(HTML_DOC)
    assert out.count("Content-Security-Policy") == 1 and "<style>h1{color:red}</style>" in out
    assert out.index("Content-Security-Policy") < out.index("<style>")
    for doc in ["<html><body>x</body></html>", "<!doctype html><p>x</p>", "<p>x</p>", "", "<HEAD><style>a{}</style></HEAD>"]:
        r = formats.inject_csp(doc)
        assert r.count("Content-Security-Policy") == 1
        assert r.lower().index("<head") < r.index("Content-Security-Policy")


def test_html_pdf_endpoints(client):
    base = workspace.workspace_for("u1")
    (base / "p.html").write_text(HTML_DOC, encoding="utf-8")
    (base / "d.md").write_text(MD, encoding="utf-8")
    make_pdf(base / "d.pdf")
    r = client.get("/files/preview", params={"path": "p.html"})
    b = r.json()
    assert r.status_code == 200 and b["kind"] == "html"
    assert "Content-Security-Policy" in b["html"] and "<style>h1{color:red}</style>" in b["html"]
    assert "default-src 'none'" in b["html"]

    pdf = client.get("/files/preview", params={"path": "d.pdf"}).json()
    assert pdf["kind"] == "pdf" and pdf["html"] == "" and pdf["version"].isdigit()
    assert client.get("/files/preview", params={"path": "d.md"}).json()["kind"] == "pdf"  # pdf twin
    make_docx(base / "d.docx")
    assert client.get("/files/preview", params={"path": "d.md"}).json()["kind"] == "docx"  # docx wins

    d = client.get("/files/download", params={"path": "d.pdf"})
    assert d.headers["content-type"].startswith("application/pdf") and d.content.startswith(b"%PDF")
    h = client.get("/files/download", params={"path": "p.html"})
    assert h.headers["content-type"].startswith("text/html") and h.content.decode() == HTML_DOC
    assert {f["kind"] for f in client.get("/files").json()} == {"html", "pdf", "md", "docx"}


def test_html_pdf_error_codes(client, monkeypatch):
    for bad, code in [("../x.html", 400), ("/etc/x.pdf", 400), ("..%2Fx.pdf", 400), ("a.html", 404),
                      ("a.pdf", 404), ("a.exe", 415), ("a.svg", 415)]:
        assert client.get("/files/preview", params={"path": bad}).status_code == code, bad
    with pytest.raises(workspace.PathEscape):
        workspace.safe_path("u1", "../u2/x.html")
    (workspace.workspace_for("u1") / "big.html").write_text("<p>x</p>")
    from dataclasses import replace
    monkeypatch.setitem(formats.ADAPTERS, ".html", replace(formats.ADAPTERS[".html"], max_bytes=3))
    assert client.get("/files/preview", params={"path": "big.html"}).status_code == 413


def test_html_pdf_file_events():
    seen: set = set()
    assert one(tool("save_file", {"file_name": "p.html"}, "p.html"), seen) == \
        {"path": "p.html", "kind": "html", "action": "created"}
    assert one(tool("replace_file_chunk", {"file_name": "p.html"}, "p.html"), seen) == \
        {"path": "p.html", "kind": "html", "action": "updated"}
    assert one(tool("delete_file", {"file_name": "p.html"}, ""), seen)["kind"] == "html"
    assert one(tool("delete_file", {"file_name": "r.pdf"}, ""), seen) == \
        {"path": "r.pdf", "kind": "pdf", "action": "deleted"}
