"""Child-process bootstrap for run_skill_script (see skill_runner.py). Standard library only.

Run as:  python -I -B -X utf8 skill_sandbox.py <policy.json string> <script.py> [args...]

It puts the script's directory on sys.path (so `from docx_common import ...` works), installs an
audit hook (PEP 578) that refuses:
  - opening / creating / deleting / renaming files outside the allowed roots
    (read+write: the user's workspace and a per-run temp dir; read only: the skill's own
    directory and the Python installation: prefixes, stdlib, site-packages),
  - starting processes (subprocess, os.system, os.exec*, os.spawn*, os.startfile, fork),
  - network access (socket connect/bind/sendto, getaddrinfo, urllib),
  - creating symlinks / hard links,
then runs the script as __main__ with the given args.

HONESTY NOTE: an audit hook is defense in depth, NOT a sandbox. Native code (C extensions,
ctypes) can do I/O without raising audit events, and CPython documents that hooks are not a
security boundary. It is useful here because the scripts are fixed code we ship; the model only
controls their arguments and the JSON specs in the workspace, and the hook stops those from
steering a script to read or write files outside the workspace (e.g. an absolute image path in a
docx spec). The parent adds the other layers: argument checks, cwd = workspace, stripped env,
timeout, output caps. For untrusted code, use an OS-level sandbox (container, seccomp, Job object).
"""
import json
import os
import runpy
import sys
import threading

_WRITE_FLAGS = (
    os.O_WRONLY | os.O_RDWR | os.O_APPEND | os.O_CREAT | os.O_TRUNC
    | getattr(os, "O_EXCL", 0) | getattr(os, "O_TEMPORARY", 0)
)
# Events refused outright (the scripts never need them).
_DENY = {
    "subprocess.Popen", "os.system", "os.exec", "os.posix_spawn", "os.spawn", "os.startfile",
    "os.fork", "os.forkpty", "pty.spawn", "_winapi.CreateProcess",
    "socket.connect", "socket.bind", "socket.sendto", "socket.sendmsg", "socket.getaddrinfo",
    "socket.gethostbyname", "socket.gethostbyaddr", "urllib.Request", "webbrowser.open",
    "os.symlink", "os.link",
}
# ctypes.dlopen is NOT denied: pypdfium2 (pdf page rendering) loads its library through ctypes.
# Events whose first argument is a path that will be modified.
_WRITE_PATH_EVENTS = {
    "os.remove", "os.rmdir", "os.mkdir", "os.chmod", "os.chown", "os.truncate", "os.utime",
    "os.chflags", "os.lchflags", "os.setxattr", "os.removexattr", "shutil.rmtree",
    "tempfile.mkstemp", "tempfile.mkdtemp",
}
# Events whose first argument is a path that will be read (listing / cwd).
_READ_PATH_EVENTS = {"os.listdir", "os.scandir", "os.chdir", "os.listxattr", "os.getxattr"}


def _real(path) -> str:
    return os.path.normcase(os.path.realpath(os.path.abspath(os.fsdecode(path))))


def _under(path: str, roots) -> bool:
    return any(path == r or path.startswith(r.rstrip(os.sep) + os.sep) for r in roots)


def _python_roots() -> list[str]:
    """Read-only roots for the interpreter: its prefixes plus site-packages directories on sys.path.
    (An env layered by `uv run --with` puts the project venv's site-packages on sys.path through a
    .pth.) Other sys.path entries a .pth might add (e.g. a repo root, which could contain the
    workspace root) are NOT trusted."""
    roots = {sys.prefix, sys.base_prefix, sys.exec_prefix, sys.base_exec_prefix}
    try:
        import site
        roots.update(site.getsitepackages())
    except Exception:
        pass
    for entry in sys.path:
        parts = {p.lower() for p in os.path.normpath(entry or ".").split(os.sep)}
        if parts & {"site-packages", "dist-packages"} or os.path.isfile(os.path.join(entry, "pyvenv.cfg")):
            roots.add(entry)
    return [_real(r) for r in roots if r]


def install(policy: dict) -> None:
    rw = [_real(p) for p in policy["rw"]]
    ro = rw + [_real(p) for p in policy["ro"]] + _python_roots()
    devnull = _real(os.devnull)
    busy = threading.local()

    def check(path, write: bool, event: str) -> None:
        if path is None or isinstance(path, int):  # an already-open fd
            return
        try:
            real = _real(path)
        except Exception:
            raise PermissionError(f"sandbox: unresolvable path for {event}")
        if real == devnull:
            return
        if not _under(real, rw if write else ro):
            raise PermissionError(
                f"sandbox: {'write' if write else 'read'} outside the workspace is not allowed: {os.fsdecode(path)}")

    def hook(event: str, args) -> None:
        if getattr(busy, "on", False):  # realpath() inside the check may raise events of its own
            return
        if event in _DENY or event.startswith(("os.exec", "os.spawn", "os.posix_spawn")):
            raise PermissionError(f"sandbox: {event} is not allowed")
        busy.on = True
        try:
            if event == "open":
                path, mode, flags = (tuple(args) + (None, None, 0))[:3]
                write = (isinstance(mode, str) and any(c in mode for c in "wax+")) or bool(
                    isinstance(flags, int) and flags & _WRITE_FLAGS)
                check(path, write, event)
            elif event == "os.rename":  # also os.replace and shutil.move's final step
                check(args[0], True, event)
                check(args[1], True, event)
            elif event in _WRITE_PATH_EVENTS and args:
                check(args[0], True, event)
            elif event in _READ_PATH_EVENTS:
                check(args[0] if args and args[0] is not None else ".", False, event)
        finally:
            busy.on = False

    sys.addaudithook(hook)


def main() -> None:
    policy = json.loads(sys.argv[1])
    script = sys.argv[2]
    sys.dont_write_bytecode = True
    sys.path.insert(0, os.path.dirname(script))
    install(policy)
    sys.argv = [script, *sys.argv[3:]]
    try:
        runpy.run_path(script, run_name="__main__")
    except Exception as e:
        # Short traceback: the last frames say what failed without eating the stderr cap.
        import traceback
        traceback.print_exception(type(e), e, e.__traceback__, limit=-3, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
