"""Shared run logging: every application run writes its logs to one SQLite DB.

    import runlog
    runlog.start("dots-in-chat")        # once, as early as possible in the process

Database: <repo>/data/logdb/logs.db (override with RUNLOG_DB; disable with RUNLOG_DISABLE=1).
Stdlib only, so any project in this repo can import it.

What is captured, at DEBUG level, from every library in the process:
  - all `logging` records (root + agno's non-propagating loggers), with file/line/function,
    thread, process, exception tracebacks and any `extra=` fields;
  - warnings (`warnings.warn`), print()/stdout/stderr output (logger "stdout"/"stderr"),
    uncaught exceptions (main thread and other threads);
  - one row per run in `runs`: app, argv, cwd, pid, python/platform, git commit/branch/dirty,
    non-secret environment, start/end time and exit status.
Secrets (API keys, tokens, passwords, Authorization headers) are redacted before storage.

A run with `ended_at IS NULL` was killed (or the machine lost power): it never reached atexit.

Query it:   python runlog.py runs | tail [-n 50] [--run ID] [--level WARNING] [--logger app] [--grep text]
            sqlite3 data/logdb/logs.db "select * from v_logs where level='ERROR' order by id desc limit 20"
"""

from __future__ import annotations

import argparse
import atexit
import json
import logging
import os
import platform
import queue
import re
import socket
import sqlite3
import subprocess
import sys
import threading
import time
import traceback
import uuid
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_DB = ROOT / "data" / "logdb" / "logs.db"
MAX_MESSAGE_CHARS = 200_000  # one runaway log line must not bloat the DB

SCHEMA = """
CREATE TABLE IF NOT EXISTS runs (
    run_id      TEXT PRIMARY KEY,
    app         TEXT NOT NULL,
    started_at  TEXT NOT NULL,
    ended_at    TEXT,
    exit_status TEXT,            -- ok | crashed | NULL (killed / still running)
    pid         INTEGER,
    ppid        INTEGER,
    hostname    TEXT,
    argv        TEXT,
    cwd         TEXT,
    python      TEXT,
    platform    TEXT,
    git_commit  TEXT,
    git_branch  TEXT,
    git_dirty   INTEGER,
    env         TEXT             -- JSON; secret values redacted
);
CREATE TABLE IF NOT EXISTS logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id    TEXT NOT NULL REFERENCES runs(run_id),
    ts        TEXT NOT NULL,    -- UTC ISO-8601, microseconds
    epoch     REAL NOT NULL,
    level     TEXT NOT NULL,
    levelno   INTEGER NOT NULL,
    logger    TEXT NOT NULL,
    message   TEXT NOT NULL,
    module    TEXT,
    func      TEXT,
    file      TEXT,
    line      INTEGER,
    thread    TEXT,
    process   INTEGER,
    exc_text  TEXT,
    extra     TEXT              -- JSON of non-standard record attributes
);
CREATE INDEX IF NOT EXISTS idx_logs_run    ON logs(run_id, id);
CREATE INDEX IF NOT EXISTS idx_logs_level  ON logs(levelno, id);
CREATE INDEX IF NOT EXISTS idx_logs_logger ON logs(logger);
CREATE INDEX IF NOT EXISTS idx_logs_ts     ON logs(ts);
CREATE VIEW IF NOT EXISTS v_logs AS
    SELECT l.id, l.ts, r.app, l.run_id, l.level, l.logger, l.message, l.exc_text,
           l.file, l.line, l.func, l.thread, l.extra
    FROM logs l JOIN runs r USING (run_id);
"""

# --- secret redaction -------------------------------------------------------------------------

_SECRET_NAME = r"(?:api[_-]?key|apikey|secret|token|password|passwd|authorization|jwt|credential|private[_-]?key)"
_REDACTIONS = [
    (re.compile(r"AIza[0-9A-Za-z_\-]{30,}"), "<redacted:google-key>"),
    (re.compile(r"\bgsk_[0-9A-Za-z]{20,}"), "<redacted:groq-key>"),
    (re.compile(r"\bsk-[0-9A-Za-z_\-]{20,}"), "<redacted:api-key>"),
    (re.compile(r"(?i)\bBearer\s+[0-9A-Za-z._\-~+/=]{8,}"), "Bearer <redacted>"),
    (re.compile(r"\beyJ[0-9A-Za-z_\-]{8,}\.[0-9A-Za-z_\-]{8,}\.[0-9A-Za-z_\-]{8,}"), "<redacted:jwt>"),
    # key=value / key: value / "key": "value" / 'key': 'value'
    (re.compile(rf"""(?i)(["']?[\w\-]*{_SECRET_NAME}[\w\-]*["']?\s*[:=]\s*)(["']?)(?!(?:\d+(?:\.\d+)?|true|false|none|null)\b)[^\s"',;&}}\]]+\2"""), r"\1<redacted>"),
]
_SECRET_NAME_RE = re.compile(_SECRET_NAME, re.I)


_ANSI = re.compile(r"\[[0-9;?]*[A-Za-z]")


def redact(text: str) -> str:
    text = _ANSI.sub("", text)  # colour codes from rich/uvicorn consoles
    for pattern, repl in _REDACTIONS:
        text = pattern.sub(repl, text)
    return text


# --- the handler ------------------------------------------------------------------------------

_STD_ATTRS = set(logging.LogRecord("", 0, "", 0, "", (), None).__dict__) | {"message", "asctime", "taskName"}


def _utc(epoch: float) -> str:
    return datetime.fromtimestamp(epoch, timezone.utc).isoformat(timespec="microseconds")


def _json(obj) -> str:
    return json.dumps(obj, default=repr, ensure_ascii=False)


class SQLiteLogHandler(logging.Handler):
    """Queues records and writes them from one background thread, so logging never blocks the
    event loop on disk I/O and several processes can share the DB (WAL + busy timeout)."""

    def __init__(self, db_path: Path, run_id: str):
        super().__init__(level=logging.DEBUG)
        self.db_path, self.run_id = db_path, run_id
        self._q: queue.SimpleQueue = queue.SimpleQueue()
        self._thread = threading.Thread(target=self._writer, name="runlog-writer", daemon=True)
        self._thread.start()

    # -- producer side
    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = record.getMessage()
            exc = None
            if record.exc_info:
                exc = "".join(traceback.format_exception(*record.exc_info))
            elif record.exc_text:
                exc = record.exc_text
            if record.stack_info:
                exc = (exc or "") + "\n" + record.stack_info
            extra = {k: v for k, v in record.__dict__.items() if k not in _STD_ATTRS and not k.startswith("_")}
            row = (
                self.run_id, _utc(record.created), record.created, record.levelname, record.levelno,
                record.name, redact(msg[:MAX_MESSAGE_CHARS]), record.module, record.funcName,
                record.pathname, record.lineno, record.threadName, record.process,
                redact(exc[:MAX_MESSAGE_CHARS]) if exc else None,
                redact(_json(extra)[:MAX_MESSAGE_CHARS]) if extra else None,
            )
            self._q.put(row)
        except Exception:  # never let logging break the app
            pass

    # -- consumer side
    def _writer(self) -> None:
        conn = _connect(self.db_path)
        sql = (
            "INSERT INTO logs (run_id, ts, epoch, level, levelno, logger, message, module, func, file,"
            " line, thread, process, exc_text, extra) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        )
        while True:
            row = self._q.get()
            batch = [row]
            deadline = time.monotonic() + 0.25  # gather a burst into one transaction
            while len(batch) < 500:
                try:
                    batch.append(self._q.get(timeout=max(0.0, deadline - time.monotonic())))
                except queue.Empty:
                    break
            stop = any(r is None for r in batch)
            batch = [r for r in batch if r is not None]
            if batch:
                for attempt in range(5):
                    try:
                        with conn:
                            conn.executemany(sql, batch)
                        break
                    except sqlite3.Error:
                        time.sleep(0.2 * (attempt + 1))
            if stop:
                return

    def flush_and_stop(self, timeout: float = 5.0) -> None:
        self._q.put(None)
        self._thread.join(timeout)


def _connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, timeout=30, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA busy_timeout=30000")
    return conn


# --- stdout/stderr tee ------------------------------------------------------------------------

class _Tee:
    """Passes writes through unchanged and logs each complete line. A thread-local guard stops
    loops when a console log handler writes back into the tee."""

    _guard = threading.local()

    def __init__(self, stream, name: str, level: int):
        self._stream, self._log, self._level, self._buf = stream, logging.getLogger(name), level, ""

    def write(self, data):
        n = self._stream.write(data)
        if getattr(self._guard, "busy", False) or not isinstance(data, str):
            return n
        self._guard.busy = True
        try:
            self._buf += data
            *lines, self._buf = self._buf.split("\n")
            for line in lines:
                if line.strip():
                    self._log.log(self._level, line.rstrip("\r"))
        finally:
            self._guard.busy = False
        return n

    def flush(self):
        self._stream.flush()

    def __getattr__(self, name):  # encoding, isatty, fileno, ...
        return getattr(self._stream, name)


# --- run bootstrap ----------------------------------------------------------------------------

_state: dict = {}
_lock = threading.Lock()


def _git(*args: str) -> str | None:
    try:
        out = subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, timeout=3)
        return out.stdout.strip() if out.returncode == 0 else None
    except Exception:
        return None


def _env_snapshot() -> dict:
    keep = re.compile(r"^(PYTHON|UV_|VIRTUAL_ENV|AGNO|RUNLOG|PRIMARY_MODEL|GROQ_MODEL|GEMINI_MODELS|"
                      r"GEMINI_THINKING|APP_|AGENT_|TOOL_CACHE|PUBLIC_URL|PATH$|PWD$|COMPUTERNAME|USERNAME)", re.I)
    out = {}
    for k, v in sorted(os.environ.items()):
        if keep.match(k) or _SECRET_NAME_RE.search(k) or k.endswith(("_KEY", "_SECRET")):
            out[k] = "<redacted>" if _SECRET_NAME_RE.search(k) or k.endswith(("_KEY", "_SECRET")) else v
    return out


def current_run_id() -> str | None:
    return _state.get("run_id")


def start(app: str, *, level: int = logging.DEBUG, capture_std: bool = True) -> str | None:
    """Begin logging this process's run into the DB; returns the run id (None if disabled).
    Safe to call twice: later calls return the same run id."""
    if os.getenv("RUNLOG_DISABLE", "").lower() in ("1", "true", "yes"):
        return None
    with _lock:
        if _state:
            return _state["run_id"]
        db_path = Path(os.getenv("RUNLOG_DB") or DEFAULT_DB)
        try:
            db_path.parent.mkdir(parents=True, exist_ok=True)
            conn = _connect(db_path)
            conn.executescript(SCHEMA)
        except Exception as e:  # unwritable disk etc.: run without DB logging rather than not at all
            print(f"runlog: disabled ({e})", file=sys.stderr)
            return None
        started = time.time()
        run_id = f"{datetime.fromtimestamp(started, timezone.utc):%Y%m%dT%H%M%S}-{uuid.uuid4().hex[:8]}"
        status = _git("status", "--porcelain")
        with conn:
            conn.execute(
                "INSERT INTO runs (run_id, app, started_at, pid, ppid, hostname, argv, cwd, python,"
                " platform, git_commit, git_branch, git_dirty, env) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (run_id, app, _utc(started), os.getpid(), os.getppid(), socket.gethostname(),
                 _json(sys.argv), os.getcwd(), sys.version, platform.platform(),
                 _git("rev-parse", "HEAD"), _git("rev-parse", "--abbrev-ref", "HEAD"),
                 None if status is None else int(bool(status)), _json(_env_snapshot())),
            )
        conn.close()

        handler = SQLiteLogHandler(db_path, run_id)
        root = logging.getLogger()
        root.addHandler(handler)
        root.setLevel(level)
        # Agno's loggers don't propagate to root and reset themselves to INFO per run unless
        # AGNO_DEBUG=true. Debug them and keep their own console handlers at INFO.
        os.environ.setdefault("AGNO_DEBUG", "true")
        try:  # create agno's loggers (with their console handlers) before we touch them
            import agno.utils.log  # noqa: F401
        except Exception:
            pass
        for name in ("agno", "agno-team", "agno-workflow"):
            lg = logging.getLogger(name)
            if lg.handlers:  # exists already (agno imported first)
                for h in lg.handlers:
                    h.setLevel(logging.INFO)
                lg.setLevel(level)
            lg.addHandler(handler)
        logging.captureWarnings(True)

        _state.update(run_id=run_id, handler=handler, db_path=db_path, status="ok",
                      stdout=sys.stdout, stderr=sys.stderr)
        _install_hooks()
        if capture_std:
            sys.stdout = _Tee(sys.stdout, "stdout", logging.INFO)
            sys.stderr = _Tee(sys.stderr, "stderr", logging.WARNING)
        atexit.register(_finish)
        logging.getLogger("runlog").info("run %s started (app=%s, db=%s)", run_id, app, db_path)
        return run_id


def _install_hooks() -> None:
    log = logging.getLogger("runlog")
    prev_hook, prev_thread_hook = sys.excepthook, threading.excepthook

    def excepthook(tp, val, tb):
        _state["status"] = "crashed"
        log.critical("uncaught exception", exc_info=(tp, val, tb))
        prev_hook(tp, val, tb)

    def thread_hook(args):
        log.critical("uncaught exception in thread %s", getattr(args.thread, "name", "?"),
                     exc_info=(args.exc_type, args.exc_value, args.exc_traceback))
        prev_thread_hook(args)

    sys.excepthook, threading.excepthook = excepthook, thread_hook


def _finish() -> None:
    if not _state:
        return
    log = logging.getLogger("runlog")
    log.info("run %s ending (%s)", _state["run_id"], _state["status"])
    handler: SQLiteLogHandler = _state["handler"]
    handler.flush_and_stop()
    try:
        conn = _connect(_state["db_path"])
        with conn:
            conn.execute("UPDATE runs SET ended_at=?, exit_status=? WHERE run_id=?",
                         (_utc(time.time()), _state["status"], _state["run_id"]))
        conn.close()
    except sqlite3.Error:
        pass


# --- CLI --------------------------------------------------------------------------------------

def _cli() -> None:
    ap = argparse.ArgumentParser(description="Inspect the run log DB.")
    ap.add_argument("cmd", choices=["runs", "tail"])
    ap.add_argument("-n", type=int, default=40, help="rows to show")
    ap.add_argument("--run", help="run id (default: latest run)")
    ap.add_argument("--level", default="DEBUG", help="minimum level")
    ap.add_argument("--logger", help="logger name prefix")
    ap.add_argument("--grep", help="substring of the message")
    ap.add_argument("--db", default=str(os.getenv("RUNLOG_DB") or DEFAULT_DB))
    a = ap.parse_args()
    conn = sqlite3.connect(a.db)
    if a.cmd == "runs":
        for r in conn.execute(
            "SELECT r.run_id, r.app, r.started_at, COALESCE(r.exit_status,'(no end)'), r.git_branch,"
            " (SELECT count(*) FROM logs WHERE run_id=r.run_id) FROM runs r ORDER BY started_at DESC LIMIT ?",
            (a.n,),
        ):
            print("  ".join(str(c) for c in r))
        return
    run = a.run or (conn.execute("SELECT run_id FROM runs ORDER BY started_at DESC LIMIT 1").fetchone() or [None])[0]
    q = "SELECT ts, level, logger, message, exc_text FROM logs WHERE run_id=? AND levelno>=?"
    args: list = [run, logging.getLevelName(a.level.upper())]
    if a.logger:
        q, args = q + " AND logger LIKE ?", args + [a.logger + "%"]
    if a.grep:
        q, args = q + " AND message LIKE ?", args + [f"%{a.grep}%"]
    rows = conn.execute(q + " ORDER BY id DESC LIMIT ?", args + [a.n]).fetchall()[::-1]
    print(f"# run {run}")
    for ts, level, name, msg, exc in rows:
        print(f"{ts[11:23]} {level:<8} {name}: {msg}")
        if exc:
            print(exc.rstrip())


if __name__ == "__main__":
    _cli()
