"""run_skill_script: the real copied skill scripts end to end, plus a fake skill (tmp skills root)
for the sandbox edges: arg / name rejection, timeout, env, audit hook, output cap, workspace diff.

Run from the repo root:  uv run --with pytest pytest dots-in-chat/tests/test_skill_runner.py -q
"""
import asyncio
import json
import os
import sys
import textwrap
from pathlib import Path

os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("CONNECTOR_SECRET", "PYB0Zf4m2gHq0y1o2kZr9bq2o8n3Jx0Yq9sQeWk3m1A=")  # dummy Fernet key
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from app.agent import skill_runner  # noqa: E402
from app.agent.skill_runner import SkillScriptTools, run_script  # noqa: E402

REAL = skill_runner.SKILLS_ROOT
HAS_DOCX = (REAL / "microsoft-office" / "scripts" / "docx_create.py").is_file()
HAS_PDF = (REAL / "pdf" / "scripts" / "pdf_create.py").is_file()


@pytest.fixture()
def ws(tmp_path):
    w = tmp_path / "ws"
    w.mkdir()
    return w


@pytest.fixture()
def fake(tmp_path):
    """A skills root with one skill `t` whose scripts probe the sandbox."""
    d = tmp_path / "skills" / "t" / "scripts"
    d.mkdir(parents=True)
    scripts = {
        "helper_lib": "VALUE = 42\n",
        "uses_sibling": "from helper_lib import VALUE\nprint(VALUE)\n",
        "echo": "import sys, json\nprint(json.dumps(sys.argv[1:]))\n",
        "write": "import os, sys\nos.makedirs(os.path.dirname(sys.argv[1]) or '.', exist_ok=True)\n"
                 "open(sys.argv[1], 'w').write(sys.argv[2] if len(sys.argv) > 2 else 'x')\n",
        "delete": "import os, sys\nos.remove(sys.argv[1])\n",
        "read_spec": textwrap.dedent("""\
            import json, sys
            spec = json.load(open(sys.argv[1]))
            print(open(spec["path"]).read())
        """),
        "write_spec": textwrap.dedent("""\
            import json, sys
            spec = json.load(open(sys.argv[1]))
            open(spec["path"], "w").write("pwned")
        """),
        "env": "import os, json\nprint(json.dumps(dict(os.environ)))\n",
        "sleep": "import time\ntime.sleep(60)\n",
        "spawn": "import subprocess, sys\nsubprocess.run([sys.executable, '-c', 'print(1)'])\n",
        "net": "import socket\nsocket.create_connection(('127.0.0.1', 9), timeout=1)\n",
        "listdir": "import os, sys\nprint(os.listdir(sys.argv[1]))\n",
        "tmp": "import tempfile\nf = tempfile.NamedTemporaryFile(delete=False)\nf.write(b'ok')\nf.close()\nprint('tmp ok')\n",
        "spam": "print('x' * 50000)\nimport sys\nsys.stderr.write('e' * 50000)\n",
        "fail": "raise ValueError('bad spec')\n",
        "_private": "print('hidden')\n",
    }
    for name, code in scripts.items():
        (d / f"{name}.py").write_text(code, encoding="utf-8")
    return tmp_path / "skills"


def run(ws, script, args=None, root=None, **kw) -> dict:
    return json.loads(run_script(ws, "t" if root else "x", script, args, skills_root=root, **kw))


# ---- the real copied skills ---------------------------------------------------------------------

@pytest.mark.skipif(not HAS_DOCX, reason="microsoft-office skill not copied yet")
def test_real_docx_create_read_edit(ws):
    from docx import Document
    spec = {"blocks": [{"type": "heading", "text": "Brief", "level": 1},
                       {"type": "paragraph", "text": "Hello world"},
                       {"type": "bullet_list", "items": ["a", "b"]},
                       {"type": "table", "header": ["K", "V"], "rows": [["x", "1"]]}]}
    (ws / "spec.json").write_text(json.dumps(spec), encoding="utf-8")
    r = json.loads(run_script(ws, "microsoft-office", "docx_create", ["spec.json", "brief.docx"]))
    assert r["ok"] and r["exit_code"] == 0, r
    assert r["changed"] == [{"path": "brief.docx", "action": "created", "kind": "docx"}]
    doc = Document(ws / "brief.docx")
    assert doc.paragraphs[0].text == "Brief" and len(doc.tables) == 1

    read = json.loads(run_script(ws, "microsoft-office", "docx_read.py", ["--text", "brief.docx"]))
    assert read["ok"] and "Hello world" in read["stdout"] and read["changed"] == []

    # a second create over the same output is an update
    r2 = json.loads(run_script(ws, "microsoft-office", "docx_create", ["spec.json", "brief.docx"]))
    assert r2["changed"] == [{"path": "brief.docx", "action": "updated", "kind": "docx"}]


@pytest.mark.skipif(not HAS_DOCX, reason="microsoft-office skill not copied yet")
def test_real_docx_spec_cannot_pull_in_outside_files(ws, tmp_path):
    secret = tmp_path / "secret.png"
    secret.write_bytes(b"\x89PNG not really")
    spec = {"blocks": [{"type": "image", "path": str(secret), "width_mm": 20}]}
    (ws / "evil.json").write_text(json.dumps(spec), encoding="utf-8")
    r = json.loads(run_script(ws, "microsoft-office", "docx_create", ["evil.json", "evil.docx"]))
    assert not r["ok"] and "sandbox: read outside the workspace" in r["stderr"], r
    assert str(ws) not in r["stderr"]  # server paths are shortened in output


@pytest.mark.skipif(not HAS_PDF, reason="pdf skill not copied yet")
def test_real_pdf_create_and_read(ws):
    spec = {"title": "Report", "elements": [{"type": "heading", "text": "Quarterly", "level": 1},
                                             {"type": "paragraph", "text": "Revenue grew."},
                                             {"type": "table", "rows": [["A", "B"], ["1", "2"]], "header": True}]}
    (ws / "spec.json").write_text(json.dumps(spec), encoding="utf-8")
    r = json.loads(run_script(ws, "pdf", "pdf_create", ["spec.json", "-o", "report.pdf"]))
    assert r["ok"], r
    assert r["changed"] == [{"path": "report.pdf", "action": "created", "kind": "pdf"}]
    assert (ws / "report.pdf").read_bytes().startswith(b"%PDF")
    read = json.loads(run_script(ws, "pdf", "pdf_read", ["--text", "report.pdf"]))
    assert read["ok"] and "Revenue grew" in read["stdout"], read


def test_toolkit_is_async_and_returns_json(ws, fake):
    tk = SkillScriptTools(base_dir=ws, skills_root=fake)
    assert "run_skill_script" in tk.async_functions or "run_skill_script" in tk.functions
    out = json.loads(asyncio.run(tk.run_skill_script("t", "echo", ["a.json", "--mode", "text"])))
    assert out["ok"] and json.loads(out["stdout"]) == ["a.json", "--mode", "text"]
    assert set(out) == {"ok", "exit_code", "stdout", "stderr", "changed"}


# ---- names and args -----------------------------------------------------------------------------

@pytest.mark.parametrize("skill,script", [
    ("../t", "echo"), ("t/..", "echo"), ("t", "../t/scripts/echo"), ("t", "..\\echo"), ("t", "sub/echo"),
    ("t", "echo.sh"), ("t", "missing"), ("nope", "echo"), ("", "echo"), ("t", ""), ("t", "_private"),
    (".", "echo"), ("t", "C:echo"), (None, "echo"), ("t", 5),
])
def test_rejects_bad_skill_or_script(ws, fake, skill, script):
    r = json.loads(run_script(ws, skill, script, [], skills_root=fake))
    assert r["ok"] is False and r["exit_code"] is None and r["stderr"].startswith("Error"), r
    assert r["changed"] == []


def test_unknown_script_lists_available(ws, fake):
    r = json.loads(run_script(ws, "t", "missing", skills_root=fake))
    assert "echo" in r["stderr"] and "_private" not in r["stderr"]


@pytest.mark.parametrize("args", [
    ["/etc/passwd"], ["C:/Windows/win.ini"], ["c:\\x.docx"], ["\\\\server\\share\\x"], ["\\x"],
    ["../x.json"], ["a/../../x"], ["a\\..\\x"], ["--out=/abs.pdf"], ["--out=..\\x.pdf"], ["~/x"],
    ["a\0b"], [1], [None], "spec.json", ["x"] * 65, ["y" * 5000],
])
def test_rejects_bad_args(ws, fake, args):
    r = json.loads(run_script(ws, "t", "echo", args, skills_root=fake))
    assert r["ok"] is False and r["exit_code"] is None and r["stderr"].startswith("Error"), (args, r)


def test_allows_relative_args_and_options(ws, fake):
    args = ["spec.json", "out/doc.docx", "--page", "1-3", "--mode=text", "a..b.json", "-"]
    r = run(ws, "echo", args, fake)
    assert r["ok"] and json.loads(r["stdout"]) == args


# ---- isolation ----------------------------------------------------------------------------------

def test_sibling_imports_work(ws, fake):
    r = run(ws, "uses_sibling", [], fake)
    assert r["ok"] and r["stdout"].strip() == "42", r


def test_env_is_stripped(ws, fake, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "sk-secret-gemini")
    monkeypatch.setenv("JWT_SECRET", "jwt-secret-value")
    monkeypatch.setenv("SOME_TOKEN", "tok-123")
    r = run(ws, "env", [], fake)
    assert r["ok"], r
    env = json.loads(r["stdout"])
    for key in ("GEMINI_API_KEY", "JWT_SECRET", "CONNECTOR_SECRET", "SOME_TOKEN", "GROQ_API_KEY"):
        assert key not in env
    for value in ("sk-secret-gemini", "jwt-secret-value", "tok-123"):
        assert value not in r["stdout"]
    assert set(env) <= set(skill_runner._ENV_KEEP) | {"TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE"}


def test_audit_hook_blocks_reads_and_writes_outside(ws, fake, tmp_path):
    secret = tmp_path / "secret.txt"
    secret.write_text("TOP SECRET")
    (ws / "spec.json").write_text(json.dumps({"path": str(secret)}))
    r = run(ws, "read_spec", ["spec.json"], fake)
    assert not r["ok"] and "TOP SECRET" not in r["stdout"] and "sandbox: read outside" in r["stderr"], r

    (ws / "spec2.json").write_text(json.dumps({"path": str(tmp_path / "planted.txt")}))
    r = run(ws, "write_spec", ["spec2.json"], fake)
    assert not r["ok"] and "sandbox: write outside" in r["stderr"] and not (tmp_path / "planted.txt").exists()

    # the skill dir is readable but not writable
    target = fake / "t" / "scripts" / "echo.py"
    (ws / "spec3.json").write_text(json.dumps({"path": str(target)}))
    assert run(ws, "read_spec", ["spec3.json"], fake)["ok"]
    r = run(ws, "write_spec", ["spec3.json"], fake)
    assert not r["ok"] and "pwned" not in target.read_text()

    # listing the workspace is fine
    assert run(ws, "listdir", ["."], fake)["ok"]


def test_audit_hook_follows_symlinks(ws, fake, tmp_path):
    secret = tmp_path / "secret.txt"
    secret.write_text("TOP SECRET")
    try:
        (ws / "link.txt").symlink_to(secret)
    except (OSError, NotImplementedError):
        pytest.skip("symlinks not permitted here")
    (ws / "spec.json").write_text(json.dumps({"path": "link.txt"}))
    r = run(ws, "read_spec", ["spec.json"], fake)
    assert not r["ok"] and "TOP SECRET" not in r["stdout"]


def test_processes_and_network_are_denied(ws, fake):
    r = run(ws, "spawn", [], fake)
    assert not r["ok"] and "is not allowed" in r["stderr"], r
    r = run(ws, "net", [], fake)
    assert not r["ok"] and "socket" in r["stderr"] and "is not allowed" in r["stderr"], r


def test_temp_dir_is_private_and_usable(ws, fake):
    r = run(ws, "tmp", [], fake)
    assert r["ok"] and "tmp ok" in r["stdout"] and r["changed"] == [], r


def test_timeout_kills(ws, fake):
    import time
    t = time.monotonic()
    r = run(ws, "sleep", [], fake, timeout=2)
    assert time.monotonic() - t < 20
    assert r["ok"] is False and "timed out" in r["stderr"], r


def test_output_is_capped(ws, fake):
    r = run(ws, "spam", [], fake)
    assert len(r["stdout"]) < skill_runner.OUTPUT_CAP + 100 and r["stdout"].endswith("[output truncated]")
    assert len(r["stderr"]) < skill_runner.OUTPUT_CAP + 100 and r["stderr"].endswith("[output truncated]")


def test_failure_is_json_not_raise(ws, fake):
    r = run(ws, "fail", [], fake)
    assert r["ok"] is False and r["exit_code"] == 1 and "bad spec" in r["stderr"]


# ---- workspace diff -----------------------------------------------------------------------------

def test_changed_reports_created_updated_deleted_with_kinds(ws, fake):
    r = run(ws, "write", ["sub/a.docx"], fake)
    assert r["changed"] == [{"path": "sub/a.docx", "action": "created", "kind": "docx"}]
    r = run(ws, "write", ["sub/a.docx", "longer content"], fake)
    assert r["changed"] == [{"path": "sub/a.docx", "action": "updated", "kind": "docx"}]
    for name, kind in [("p.pdf", "pdf"), ("p.html", "html"), ("p.md", "md"), ("p.json", "file"), ("p.png", "file")]:
        assert run(ws, "write", [name], fake)["changed"] == [{"path": name, "action": "created", "kind": kind}]
    r = run(ws, "delete", ["p.md"], fake)
    assert r["changed"] == [{"path": "p.md", "action": "deleted", "kind": "md"}]
    assert run(ws, "echo", [], fake)["changed"] == []


def test_snapshot_and_diff_units(tmp_path):
    (tmp_path / "a.md").write_text("x")
    (tmp_path / "d").mkdir()
    (tmp_path / "d" / "b.pdf").write_bytes(b"%PDF")
    before = skill_runner.snapshot(tmp_path)
    assert set(before) == {"a.md", "d/b.pdf"}
    (tmp_path / "a.md").unlink()
    (tmp_path / "d" / "b.pdf").write_bytes(b"%PDF-1.7 longer")
    (tmp_path / "c.html").write_text("<p>")
    assert skill_runner.diff(before, skill_runner.snapshot(tmp_path)) == [
        {"path": "a.md", "action": "deleted", "kind": "md"},
        {"path": "c.html", "action": "created", "kind": "html"},
        {"path": "d/b.pdf", "action": "updated", "kind": "pdf"},
    ]


def test_core_wires_runner_and_guard(tmp_path, monkeypatch):
    from app.agent.core import INSTRUCTIONS, user_file_tools
    from app.config import settings
    monkeypatch.setattr(settings, "agent_workspace_dir", str(tmp_path / "ws"))
    from app.agent.file_guard import WorkspaceFileTools
    tools = user_file_tools("u-test-wiring")
    assert any(isinstance(t, WorkspaceFileTools) for t in tools)
    assert any(isinstance(t, SkillScriptTools) for t in tools)
    names = {n for t in tools for n in list(t.functions) + list(getattr(t, "async_functions", {}) or {})}
    assert {"save_file", "read_file", "run_skill_script"} <= names
    assert not names & {"build_docx", "build_pdf", "import_docx", "read_pdf"}
    files_line = next(i for i in INSTRUCTIONS if i.startswith("Files:"))
    assert "run_skill_script" in files_line and "microsoft-office" in files_line

