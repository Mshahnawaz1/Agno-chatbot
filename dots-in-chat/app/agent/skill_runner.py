"""run_skill_script: lets the agent run a skill's bundled script (e.g. microsoft-office's
docx_create.py, pdf's pdf_create.py) on files in its own workspace.

This is how binary documents (.docx, .pdf) get made: the model writes a JSON spec with save_file,
then calls run_skill_script("microsoft-office", "docx_create", ["spec.json", "out.docx"]).

Layers (none of them alone is a sandbox; see skill_sandbox.py for the honest version):
1. skill / script are plain names that must resolve to an existing
   skills/<skill>/scripts/<script>.py; args are strings, never absolute, never `..`, no NUL.
2. The child is `python -I -B -X utf8 skill_sandbox.py ...`: isolated mode (no PYTHON* env, no
   user site, no cwd on sys.path), cwd = the user's workspace, env reduced to a few OS
   variables (no API keys, JWT or connector secrets), its own temp dir.
3. In the child, an audit hook refuses file access outside {workspace + temp (rw), skill dir +
   Python install (r)} and refuses processes and sockets.
4. 60 s timeout (the process tree is killed), stdout / stderr capped.
The result is always a JSON string (never raises), shaped for the preview panel:
  {"ok", "exit_code", "stdout", "stderr", "changed": [{"path", "action", "kind"}]}
"""
import asyncio
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

from agno.tools import Toolkit

from app.agent.formats import kind_for

SKILLS_ROOT = Path(__file__).resolve().parents[2] / "skills"  # dots-in-chat/skills
SANDBOX = Path(__file__).resolve().with_name("skill_sandbox.py")
TIMEOUT_SECONDS = 60
OUTPUT_CAP = 4000  # chars kept of stdout and of stderr
MAX_ARGS = 64
MAX_ARG_LEN = 4096
_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]*$")
_DRIVE = re.compile(r"^[A-Za-z]:")
# OS variables the child may keep; everything else (keys, secrets, PATH-like injection) is dropped.
_ENV_KEEP = ("PATH", "SYSTEMROOT", "SystemRoot", "WINDIR", "SYSTEMDRIVE", "COMSPEC", "PATHEXT",
             "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE", "LANG", "LC_ALL", "TZ")


class ScriptRejected(ValueError):
    """The skill, script or args are not allowed."""


def _fail(message: str, exit_code=None) -> str:
    return json.dumps({"ok": False, "exit_code": exit_code, "stdout": "", "stderr": message, "changed": []})


def resolve_script(skills_root: Path, skill: str, script: str) -> Path:
    if not isinstance(skill, str) or not _NAME.match(skill):
        raise ScriptRejected(f"invalid skill name: {skill!r}")
    if not isinstance(script, str):
        raise ScriptRejected("script must be a string")
    name = script[:-3] if script.endswith(".py") else script
    if not _NAME.match(name):  # also rejects separators, "..", and _private helpers
        raise ScriptRejected(f"invalid script name: {script!r}")
    scripts_dir = (skills_root / skill / "scripts").resolve()
    path = (scripts_dir / f"{name}.py").resolve()
    if path.parent != scripts_dir or not path.is_file():
        available = sorted(p.stem for p in scripts_dir.glob("*.py") if not p.name.startswith("_")) \
            if scripts_dir.is_dir() else []
        hint = f" Available: {', '.join(available)}" if available else ""
        raise ScriptRejected(f"no script {name!r} in skill {skill!r}.{hint}")
    return path


def check_args(args) -> list[str]:
    if args is None:
        return []
    if not isinstance(args, list):
        raise ScriptRejected("args must be a list of strings")
    if len(args) > MAX_ARGS:
        raise ScriptRejected(f"too many args (max {MAX_ARGS})")
    out = []
    for a in args:
        if not isinstance(a, str):
            raise ScriptRejected(f"every arg must be a string, got {type(a).__name__}")
        if "\0" in a or len(a) > MAX_ARG_LEN:
            raise ScriptRejected("arg contains NUL or is too long")
        # check the arg itself and, for --opt=value, the value
        for part in {a, a.split("=", 1)[1]} if a.startswith("-") and "=" in a else {a}:
            if part.startswith(("/", "\\", "~")) or _DRIVE.match(part):
                raise ScriptRejected(f"absolute paths are not allowed: {a!r} (use a workspace-relative path)")
            if ".." in re.split(r"[\\/]", part):
                raise ScriptRejected(f"'..' is not allowed in paths: {a!r}")
        out.append(a)
    return out


def snapshot(base: Path) -> dict[str, tuple[int, int]]:
    """rel posix path -> (mtime_ns, size) for every regular file under base (symlinks skipped)."""
    out = {}
    for root, dirs, files in os.walk(base):
        for f in files:
            p = Path(root, f)
            try:
                st = p.lstat()
            except OSError:
                continue
            if p.is_symlink():
                continue
            out[p.relative_to(base).as_posix()] = (st.st_mtime_ns, st.st_size)
    return out


def diff(before: dict, after: dict) -> list[dict]:
    changed = []
    for path in sorted(before.keys() | after.keys()):
        if path not in before:
            action = "created"
        elif path not in after:
            action = "deleted"
        elif before[path] != after[path]:
            action = "updated"
        else:
            continue
        changed.append({"path": path, "action": action, "kind": kind_for(path)})
    return changed


def child_env(temp_dir: str) -> dict[str, str]:
    env = {k: os.environ[k] for k in _ENV_KEEP if k in os.environ}
    env.update({"TEMP": temp_dir, "TMP": temp_dir, "TMPDIR": temp_dir, "HOME": temp_dir,
                "USERPROFILE": temp_dir})
    return env


def _kill_tree(proc: subprocess.Popen) -> None:
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                           capture_output=True, timeout=10, check=False)
        else:
            os.killpg(proc.pid, signal.SIGKILL)
    except Exception:
        pass
    try:
        proc.kill()
    except Exception:
        pass


def _drain(stream, sink: dict, cap_bytes: int) -> None:
    """Read a pipe to EOF, keeping only the first cap_bytes (bounded memory)."""
    kept = bytearray()
    extra = 0
    for chunk in iter(lambda: stream.read(8192), b""):
        room = cap_bytes - len(kept)
        if room > 0:
            kept += chunk[:room]
        extra += max(0, len(chunk) - max(room, 0))
    sink["data"], sink["extra"] = bytes(kept), extra


def _hide_paths(workspace: Path, skills_root: Path) -> tuple[tuple[str, str], ...]:
    """Server paths in tracebacks become short labels (workspace paths become relative)."""
    pairs = [(str(workspace) + os.sep, ""), (str(skills_root), "skills"), (str(SANDBOX.parent), "app"),
             (sys.prefix, "<python>"), (sys.base_prefix, "<python>")]
    out = []
    for prefix, short in pairs:
        out += [(prefix, short), (prefix.replace("\\", "/"), short)]
    return tuple(out)


def _text(sink: dict, hide: tuple[str, ...] = ()) -> str:
    """Decoded, \\r\\n normalised, server paths shortened, capped at OUTPUT_CAP chars."""
    text = sink.get("data", b"").decode("utf-8", errors="replace").replace("\r\n", "\n")
    for prefix, short in hide:
        text = text.replace(prefix, short)
    if len(text) > OUTPUT_CAP or sink.get("extra"):
        text = text[:OUTPUT_CAP] + "\n[output truncated]"
    return text


def run_script(workspace: Path, skill: str, script: str, args=None,
               skills_root: Path | None = None, timeout: float = TIMEOUT_SECONDS) -> str:
    """Run skills/<skill>/scripts/<script>.py in the sandbox; JSON result, never raises."""
    try:
        root = Path(skills_root or SKILLS_ROOT).resolve()
        path = resolve_script(root, skill, script)
        argv = check_args(args)
    except ScriptRejected as e:
        return _fail(f"Error: {e}")
    workspace = Path(workspace).resolve()
    workspace.mkdir(parents=True, exist_ok=True)
    temp_dir = tempfile.mkdtemp(prefix="skillrun-")
    try:
        policy = {"rw": [str(workspace), temp_dir], "ro": [str(path.parent.parent)]}
        cmd = [sys.executable, "-I", "-B", "-X", "utf8", str(SANDBOX), json.dumps(policy), str(path), *argv]
        before = snapshot(workspace)
        popen_kw = {"creationflags": subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == "nt" \
            else {"start_new_session": True}
        try:
            proc = subprocess.Popen(cmd, cwd=workspace, env=child_env(temp_dir), stdin=subprocess.DEVNULL,
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, **popen_kw)
        except OSError as e:
            return _fail(f"Error: could not start the script: {e}")
        out, err = {}, {}
        readers = [threading.Thread(target=_drain, args=(proc.stdout, out, OUTPUT_CAP * 4), daemon=True),
                   threading.Thread(target=_drain, args=(proc.stderr, err, OUTPUT_CAP * 4), daemon=True)]
        for t in readers:
            t.start()
        timed_out = False
        try:
            proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            timed_out = True
            _kill_tree(proc)
            proc.wait(timeout=10)
        for t in readers:
            t.join(timeout=5)
        hide = _hide_paths(workspace, root)
        stderr = _text(err, hide)
        if timed_out:
            stderr = (stderr + "\n" if stderr else "") + f"Error: timed out after {timeout:g} s; the script was killed"
        return json.dumps({
            "ok": proc.returncode == 0 and not timed_out,
            "exit_code": proc.returncode,
            "stdout": _text(out, hide),
            "stderr": stderr,
            "changed": diff(before, snapshot(workspace)),
        })
    except Exception as e:  # never raise into the agent loop
        return _fail(f"Error: {type(e).__name__}: {e}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


class SkillScriptTools(Toolkit):
    """One user's run_skill_script tool (base_dir = their workspace)."""

    def __init__(self, base_dir: Path, skills_root: Path | None = None, **kwargs):
        self.base_dir = Path(base_dir).resolve()
        self.skills_root = skills_root
        super().__init__(name="skill_scripts", tools=[self.run_skill_script], **kwargs)

    async def run_skill_script(self, skill: str, script: str, args: list[str] | None = None) -> str:
        """Run a script bundled with a skill (skills/<skill>/scripts/<script>.py) on files in your
        workspace, e.g. skill="microsoft-office", script="docx_create", args=["spec.json", "out.docx"].
        Load the skill first: it documents each script's arguments. This is the ONLY way to create
        or change .docx / .pdf files (never save_file them).

        :param skill: The skill name, e.g. "microsoft-office" or "pdf".
        :param script: The script name, with or without ".py", e.g. "docx_create".
        :param args: Command-line arguments: workspace-relative paths and options only.
        :return: JSON {"ok", "exit_code", "stdout", "stderr", "changed": [{"path", "action", "kind"}]}.
        """
        return await asyncio.to_thread(
            run_script, self.base_dir, skill, script, args, self.skills_root)
