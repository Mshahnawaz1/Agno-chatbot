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
    assert set(listed[0]) == {"path", "name", "size", "modified", "kind", "origin"}

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


# ---- xlsx / pptx ---------------------------------------------------------------------------------

def make_xlsx(path: Path) -> None:
    import openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sales <1>"
    ws.append(["Item", "Qty", "Total"])
    ws.append(["<script>alert(1)</script>", 2, "=B2*3"])
    ws2 = wb.create_sheet("Big")
    for _ in range(250):
        ws2.append(list(range(35)))
    wb.save(path)


def make_pptx(path: Path) -> None:
    from PIL import Image
    from pptx import Presentation
    from pptx.util import Inches
    prs = Presentation()
    s = prs.slides.add_slide(prs.slide_layouts[1])
    s.shapes.title.text = "Plan <A>"
    s.placeholders[1].text_frame.text = "first point"
    s.placeholders[1].text_frame.add_paragraph().text = "second point"
    s.notes_slide.notes_text_frame.text = "say hello"
    s2 = prs.slides.add_slide(prs.slide_layouts[5])
    s2.shapes.title.text = "Data"
    t = s2.shapes.add_table(2, 2, Inches(1), Inches(2), Inches(4), Inches(1)).table
    t.cell(0, 0).text = "k"
    t.cell(1, 1).text = "v"
    png = path.parent / "pic.png"
    Image.new("RGB", (4, 4)).save(png)
    s2.shapes.add_picture(str(png), Inches(1), Inches(4))
    prs.save(path)


def test_xlsx_preview(tmp_path):
    p = tmp_path / "a.xlsx"
    make_xlsx(p)
    html = previews.xlsx_to_html(p)
    assert "<h2>Sales &lt;1&gt;</h2>" in html and "<h2>Big</h2>" in html
    assert "<script>" not in html and "&lt;script&gt;" in html
    assert "=B2*3" in html  # never opened in Excel, so no cached value: formula text
    assert "Truncated" in html and html.count("<tr>") == 2 + 200


def test_xlsx_preview_has_no_blank_padding_columns(tmp_path):
    import openpyxl

    p = tmp_path / "small.xlsx"
    wb = openpyxl.Workbook()
    wb.active.append(["Category", "Planned", "Actual"])
    wb.active.append(["Rent", 1200, 1100])
    wb.save(p)
    html = previews.xlsx_to_html(p)
    assert html.count("<td>") == 6 and "Truncated" not in html


def test_pptx_preview(tmp_path):
    p = tmp_path / "a.pptx"
    make_pptx(p)
    html = previews.pptx_to_html(p)
    assert "Slide 1: Plan &lt;A&gt;" in html and "Slide 2: Data" in html
    assert html.index("first point") < html.index("second point") and "<li>first point</li>" in html
    assert "Speaker notes: say hello" in html and "<blockquote>" in html
    assert "<td>v</td>" in html and "[image]" in html


def test_office_previews_never_raise(tmp_path):
    for name, fn in [("bad.xlsx", previews.xlsx_to_html), ("bad.pptx", previews.pptx_to_html)]:
        p = tmp_path / name
        p.write_bytes(b"not a zip")
        assert "Could not preview" in fn(p)


def test_xlsx_pptx_endpoints_and_guard(client):
    base = workspace.workspace_for("u1")
    make_xlsx(base / "a.xlsx")
    make_pptx(base / "b.pptx")
    assert {(f["path"], f["kind"]) for f in client.get("/files").json()} >= {("a.xlsx", "xlsx"), ("b.pptx", "pptx")}
    for path, kind in [("a.xlsx", "xlsx"), ("b.pptx", "pptx")]:
        body = client.get("/files/preview", params={"path": path}).json()
        assert body["kind"] == kind and body["html"] and body["version"].isdigit()
    assert "spreadsheetml" in client.get("/files/download", params={"path": "a.xlsx"}).headers["content-type"]
    assert "presentationml" in client.get("/files/download", params={"path": "b.pptx"}).headers["content-type"]
    ft = WorkspaceFileTools(base_dir=base)
    assert "xlsx_create" in ft.save_file("x", "n.xlsx") and "pptx_create" in ft.save_file("x", "n.pptx")
    assert "xlsx_read" in ft.read_file("a.xlsx") and "pptx_read" in ft.read_file("b.pptx")
    assert formats.kind_for("x/y.XLSX") == "xlsx" and formats.kind_for("y.pptx") == "pptx"


def test_xlsx_pptx_file_events():
    seen: set = set()
    r = json.dumps({"ok": True, "exit_code": 0, "stdout": "", "stderr": "", "changed": [
        {"path": "a.xlsx", "action": "created", "kind": "xlsx"}, {"path": "b.pptx", "action": "updated", "kind": "pptx"}]})
    ev = file_events(SimpleNamespace(tool_name="run_skill_script", tool_args={}, result=r), seen)
    assert ev == [{"path": "a.xlsx", "kind": "xlsx", "action": "created"},
                  {"path": "b.pptx", "kind": "pptx", "action": "updated"}]
    ev = file_events(SimpleNamespace(tool_name="delete_file", tool_args={"file_name": "a.xlsx"}, result=""), seen)
    assert ev == [{"path": "a.xlsx", "kind": "xlsx", "action": "deleted"}]


def test_workspace_relative_setting_is_anchored_to_app_root_not_cwd(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "agent_workspace_dir", "data/_ws_anchor_test")
    monkeypatch.chdir(tmp_path)
    p = workspace.workspace_for("u-anchor")
    try:
        assert p.is_relative_to(workspace.APP_ROOT) and not p.is_relative_to(tmp_path)
    finally:
        import shutil
        shutil.rmtree(workspace.APP_ROOT / "data" / "_ws_anchor_test", ignore_errors=True)


def test_read_file_points_skill_paths_to_the_skill_loader_and_hides_server_paths(tmp_path):
    t = WorkspaceFileTools(base_dir=tmp_path)
    for name in ("scripts/pdf_create.py", "skills/pdf/scripts/pdf_create.py", "../skills/pdf/scripts/x.py"):
        msg = t.read_file(name)
        assert "get_skill_instructions" in msg and "outside your workspace" in msg
    missing = t.read_file("nope.txt")
    assert str(tmp_path) not in missing


def test_script_usage_returns_the_spec_docstring_and_rejects_bad_names():
    from app.agent.skills import script_usage, skills

    sk = skills.get_skill("pdf")
    assert "elements" in script_usage(sk, "scripts/pdf_create.py")
    assert script_usage(sk, "pdf_create") is not None
    assert script_usage(sk, "../pdf_create") is None and script_usage(sk, "nope") is None


# ---- uploads ------------------------------------------------------------------------------------

def test_upload_saves_into_uploads_and_lists_origin(client, ws):
    r = client.post("/files/upload", files=[("files", ("../../my notes.md", b"# Hi\n", "text/markdown"))])
    assert r.status_code == 201
    assert r.json()[0]["path"] == "uploads/my notes.md" and r.json()[0]["origin"] == "uploaded"
    (workspace.workspace_for("u1") / "made.md").write_text("# agent")
    origins = {f["path"]: f["origin"] for f in client.get("/files").json()}
    assert origins == {"uploads/my notes.md": "uploaded", "made.md": "generated"}


def test_upload_never_overwrites_and_rejects_bad_files(client, ws, monkeypatch):
    from dataclasses import replace
    one = [("files", ("a.md", b"x", "text/markdown"))]
    assert client.post("/files/upload", files=one).json()[0]["path"] == "uploads/a.md"
    assert client.post("/files/upload", files=one).json()[0]["path"] == "uploads/a (1).md"
    assert client.post("/files/upload", files=[("files", ("a.exe", b"x", "application/x"))]).status_code == 415
    assert client.post("/files/upload", files=[("files", ("e.md", b"", "text/markdown"))]).status_code == 400
    monkeypatch.setitem(formats.ADAPTERS, ".md", replace(formats.ADAPTERS[".md"], max_bytes=3))
    assert client.post("/files/upload", files=[("files", ("big.md", b"abcd", "text/markdown"))]).status_code == 413
    # all-or-nothing: a bad file in the batch writes none of the good ones
    mixed = [("files", ("ok.md", b"x", "text/markdown")), ("files", ("bad.exe", b"x", "application/x"))]
    assert client.post("/files/upload", files=mixed).status_code == 415
    assert not (workspace.workspace_for("u1") / "uploads" / "ok.md").exists()


# ---- markdown editor ----------------------------------------------------------------------------

def test_md_preview_carries_source_and_save_roundtrips(client, ws):
    p = workspace.workspace_for("u1") / "doc.md"
    p.write_text("# T\n\nbody\n")
    prev = client.get("/files/preview", params={"path": "doc.md"}).json()
    assert prev["source"] == "# T\n\nbody\n"
    r = client.put("/files/content", json={"path": "doc.md", "content": "# T2\n", "base_version": prev["version"]})
    assert r.status_code == 200 and p.read_text() == "# T2\n"
    assert r.json()["version"] != prev["version"]
    assert not list(p.parent.glob(".*.tmp"))


def test_save_rejects_stale_version_other_types_and_oversize(client, ws, monkeypatch):
    base = workspace.workspace_for("u1")
    (base / "doc.md").write_text("one")
    v = client.get("/files/preview", params={"path": "doc.md"}).json()["version"]
    (base / "doc.md").write_text("changed elsewhere")
    os.utime(base / "doc.md", ns=(1, int(v) + 5_000_000_000))  # certainly a different mtime
    r = client.put("/files/content", json={"path": "doc.md", "content": "mine", "base_version": v})
    assert r.status_code == 409 and (base / "doc.md").read_text() == "changed elsewhere"
    (base / "r.html").write_text("<p>x</p>")
    assert client.put("/files/content", json={"path": "r.html", "content": "x"}).status_code == 415
    assert client.put("/files/content", json={"path": "../x.md", "content": "x"}).status_code == 400
    monkeypatch.setattr(files_router, "MAX_MD_BYTES", 3)
    assert client.put("/files/content", json={"path": "doc.md", "content": "abcd"}).status_code == 413


def test_ai_edit_proposes_without_writing(client, ws, monkeypatch):
    p = workspace.workspace_for("u1") / "doc.md"
    p.write_text("# T\n\nfirst\n\n- a\n- b\n")
    seen = {}

    async def fake(doc, excerpt, selected, instruction, start, end):
        seen.update(excerpt=excerpt, selected=selected, instruction=instruction, span=(start, end))
        return "SHORTER"

    monkeypatch.setattr(files_router, "rewrite_excerpt", fake)
    body = {"path": "doc.md", "start_line": 5, "end_line": 6, "selected_text": "a", "instruction": "shorten"}
    r = client.post("/files/ai-edit", json=body)
    assert r.status_code == 200 and r.json()["replacement"] == "SHORTER"
    assert seen["excerpt"] == "- a\n- b" and seen["span"] == (5, 6)
    assert p.read_text() == "# T\n\nfirst\n\n- a\n- b\n"  # nothing written
    assert client.post("/files/ai-edit", json={**body, "end_line": 99}).status_code == 400
    assert client.post("/files/ai-edit", json={**body, "path": "x.pdf"}).status_code in (404, 415)

    async def boom(*a):
        raise RuntimeError("model down")

    monkeypatch.setattr(files_router, "rewrite_excerpt", boom)
    assert client.post("/files/ai-edit", json=body).status_code == 502


def test_doc_edit_prompt_and_fence_stripping():
    from app.agent import doc_edit
    assert doc_edit.clean_reply("```markdown\n- a\n- b\n```", "- a\n- b") == "- a\n- b"
    assert doc_edit.clean_reply("```py\nx=1\n```", "```py\nx=0\n```") == "```py\nx=1\n```"  # excerpt is a fence
    assert doc_edit.clean_reply("plain\n", "x") == "plain"
    prompt = doc_edit.build_prompt("DOC", "EX", "SEL", "do it", 3, 4)
    assert '<excerpt lines="3-4">\nEX\n</excerpt>' in prompt and "Instruction: do it" in prompt
