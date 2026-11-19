import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path

from app.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    name        TEXT,
    password_hash TEXT NOT NULL,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id),
    title       TEXT,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);

-- connectors: our app's OAuth registration per provider (encrypted JSON)
CREATE TABLE IF NOT EXISTS oauth_clients (
    connector_id TEXT PRIMARY KEY,
    client       TEXT NOT NULL
);
-- in-flight OAuth logins, matched on the callback's ?state=
CREATE TABLE IF NOT EXISTS oauth_states (
    state         TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id),
    connector_id  TEXT NOT NULL,
    code_verifier TEXT NOT NULL,
    created_at    TEXT DEFAULT CURRENT_TIMESTAMP
);
-- a user's tokens or API key per connector (encrypted JSON)
CREATE TABLE IF NOT EXISTS user_connectors (
    user_id      TEXT NOT NULL REFERENCES users(id),
    connector_id TEXT NOT NULL,
    credentials  TEXT NOT NULL,
    enabled      INTEGER NOT NULL DEFAULT 1,  -- off = keep the login, don't load its tools
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, connector_id)
);
-- what an assistant turn showed, in order: text and A2UI messages (JSON), see app/a2ui/store.py
CREATE TABLE IF NOT EXISTS chat_parts (
    session_id  TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    run_id      TEXT NOT NULL,
    seq         INTEGER NOT NULL,
    kind        TEXT NOT NULL,   -- 'text' | 'a2ui'
    payload     TEXT NOT NULL,
    PRIMARY KEY (session_id, run_id, seq)
);
-- every version of a workspace file, see app/versions.py. The bytes live in the user's workspace
-- (.versions/<sha256>); sha256 is NULL for a 'deleted' version.
CREATE TABLE IF NOT EXISTS file_versions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL REFERENCES users(id),
    path       TEXT NOT NULL,           -- workspace-relative, posix
    version    INTEGER NOT NULL,        -- 1, 2, 3... per (user, path)
    action     TEXT NOT NULL,           -- 'created' | 'updated' | 'deleted' | 'restored'
    author     TEXT NOT NULL,           -- 'user' | 'agent'
    sha256     TEXT,
    size       INTEGER NOT NULL DEFAULT 0,
    mtime_ns   INTEGER NOT NULL DEFAULT 0,  -- lets a scan skip hashing an untouched file
    session_id TEXT,
    run_id     TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, path, version)
);
CREATE INDEX IF NOT EXISTS idx_file_versions_sha ON file_versions(user_id, sha256);
-- each connector's MCP tool list (JSON), so a run needn't contact the server to know it
CREATE TABLE IF NOT EXISTS connector_catalog (
    connector_id TEXT PRIMARY KEY,
    tools        TEXT NOT NULL,
    fetched_at   REAL NOT NULL
);
"""


@contextmanager
def get_conn():
    """One short-lived connection per operation. Fine for SQLite + learning."""
    conn = sqlite3.connect(settings.app_db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")  # SQLite ignores FKs unless enabled per connection
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    Path(settings.app_db_path).parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        # Databases created before the on/off switch lack the column.
        cols = {r["name"] for r in conn.execute("PRAGMA table_info(user_connectors)")}
        if "enabled" not in cols:
            conn.execute("ALTER TABLE user_connectors ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1")


# ---- chat parts (A2UI turns) ----
def add_chat_parts(session_id: str, run_id: str, parts: list[tuple[str, str]]) -> None:
    """Appends (kind, payload) rows to a turn, after any it already has."""
    with get_conn() as conn:
        start = conn.execute(
            "SELECT COALESCE(MAX(seq) + 1, 0) FROM chat_parts WHERE session_id = ? AND run_id = ?",
            (session_id, run_id),
        ).fetchone()[0]
        conn.executemany(
            "INSERT INTO chat_parts (session_id, run_id, seq, kind, payload) VALUES (?, ?, ?, ?, ?)",
            [(session_id, run_id, start + i, kind, payload) for i, (kind, payload) in enumerate(parts)],
        )


def list_chat_parts(session_id: str) -> list[dict]:
    """Every part of a session, oldest turn first (rowid keeps insertion order across turns)."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT run_id, kind, payload FROM chat_parts WHERE session_id = ? ORDER BY rowid",
            (session_id,),
        ).fetchall()
    return [dict(r) for r in rows]


# ---- users ----
# Every query except get_user_by_email selects only these columns, so the
# password hash never ends up in the `user` dict that routes receive.
PUBLIC_USER_COLUMNS = "id, email, name, created_at"


def create_user(email: str, name: str | None, password_hash: str) -> dict:
    user_id = str(uuid.uuid4())  # this becomes Agno's user_id later
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
            (user_id, email, name, password_hash),
        )
        row = conn.execute(
            f"SELECT {PUBLIC_USER_COLUMNS} FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    return dict(row)


def get_user(user_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            f"SELECT {PUBLIC_USER_COLUMNS} FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    return dict(row) if row else None


def get_user_by_email(email: str) -> dict | None:
    """Login only: includes password_hash. Never return this row to a client."""
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    return dict(row) if row else None


# ---- chat sessions ----
def create_chat_session(user_id: str, title: str | None) -> dict:
    session_id = str(uuid.uuid4())  # this becomes Agno's session_id later
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)",
            (session_id, user_id, title),
        )
        row = conn.execute(
            "SELECT * FROM chat_sessions WHERE id = ?", (session_id,)
        ).fetchone()
    return dict(row)

# Newest first
def list_chat_sessions(user_id: str) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def get_chat_session(session_id: str, user_id: str) -> dict | None:
    """Ownership check lives in the query: wrong owner looks identical to 'not found'."""
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?",
            (session_id, user_id),
        ).fetchone()
    return dict(row) if row else None

def delete_chat_session(session_id: str, user_id: str) -> bool:
    """Removes the row (its chat_parts cascade). False if it isn't this user's."""
    with get_conn() as conn:
        cur = conn.execute(
            "DELETE FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user_id)
        )
    return cur.rowcount > 0


def set_chat_session_title(session_id: str, title: str) -> None:
    with get_conn() as conn:
        conn.execute("UPDATE chat_sessions SET title = ? WHERE id = ?", (title, session_id))


def touch_chat_session(session_id: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (session_id,),
        )

# ---- connectors ----
# Values passed in here are already encrypted by app.connectors.auth.


def save_oauth_client(connector_id: str, client: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO oauth_clients (connector_id, client) VALUES (?, ?)",
            (connector_id, client),
        )


def get_oauth_client(connector_id: str) -> str | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT client FROM oauth_clients WHERE connector_id = ?", (connector_id,)
        ).fetchone()
    return row["client"] if row else None


def save_oauth_state(state: str, user_id: str, connector_id: str, code_verifier: str) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM oauth_states WHERE created_at < datetime('now', '-10 minutes')")
        conn.execute(
            "INSERT INTO oauth_states (state, user_id, connector_id, code_verifier) VALUES (?, ?, ?, ?)",
            (state, user_id, connector_id, code_verifier),
        )


def pop_oauth_state(state: str, connector_id: str) -> dict | None:
    """Single use and 10-minute expiry. Expired rows are purged by save_oauth_state."""
    with get_conn() as conn:
        row = conn.execute(
            "DELETE FROM oauth_states WHERE state = ? AND connector_id = ?"
            " AND created_at >= datetime('now', '-10 minutes') RETURNING *",
            (state, connector_id),
        ).fetchone()
    return dict(row) if row else None


def save_credentials(user_id: str, connector_id: str, credentials: str) -> None:
    with get_conn() as conn:
        conn.execute(
            # Upsert, not REPLACE: a token refresh must not reset the on/off switch.
            "INSERT INTO user_connectors (user_id, connector_id, credentials) VALUES (?, ?, ?)"
            " ON CONFLICT (user_id, connector_id) DO UPDATE SET credentials = excluded.credentials",
            (user_id, connector_id, credentials),
        )


def get_credentials(user_id: str, connector_id: str) -> str | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT credentials FROM user_connectors WHERE user_id = ? AND connector_id = ?",
            (user_id, connector_id),
        ).fetchone()
    return row["credentials"] if row else None


def list_connected(user_id: str) -> dict[str, bool]:
    """The user's connected connectors: connector_id -> switched on."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT connector_id, enabled FROM user_connectors WHERE user_id = ?", (user_id,)
        ).fetchall()
    return {r["connector_id"]: bool(r["enabled"]) for r in rows}


def set_connector_enabled(user_id: str, connector_id: str, enabled: bool) -> bool:
    """False if the user hasn't connected this connector."""
    with get_conn() as conn:
        cur = conn.execute(
            "UPDATE user_connectors SET enabled = ? WHERE user_id = ? AND connector_id = ?",
            (int(enabled), user_id, connector_id),
        )
    return cur.rowcount > 0


def delete_credentials(user_id: str, connector_id: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "DELETE FROM user_connectors WHERE user_id = ? AND connector_id = ?",
            (user_id, connector_id),
        )


def save_catalog(connector_id: str, tools: str, fetched_at: float) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO connector_catalog (connector_id, tools, fetched_at) VALUES (?, ?, ?)",
            (connector_id, tools, fetched_at),
        )


def get_catalog(connector_id: str) -> tuple[str, float] | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT tools, fetched_at FROM connector_catalog WHERE connector_id = ?", (connector_id,)
        ).fetchone()
    return (row["tools"], row["fetched_at"]) if row else None


# ---- file versions (app/versions.py) ----
def latest_file_versions(user_id: str) -> dict[str, dict]:
    """The newest version row of every path this user has history for."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT v.* FROM file_versions v JOIN ("
            " SELECT path, MAX(version) AS m FROM file_versions WHERE user_id = ? GROUP BY path"
            ") x ON v.path = x.path AND v.version = x.m WHERE v.user_id = ?",
            (user_id, user_id),
        ).fetchall()
    return {r["path"]: dict(r) for r in rows}


def add_file_version(user_id: str, path: str, action: str, author: str, sha256: str | None,
                     size: int, mtime_ns: int, session_id: str | None, run_id: str | None) -> dict:
    with get_conn() as conn:
        n = conn.execute(
            "SELECT COALESCE(MAX(version), 0) + 1 FROM file_versions WHERE user_id = ? AND path = ?",
            (user_id, path),
        ).fetchone()[0]
        conn.execute(
            "INSERT INTO file_versions (user_id, path, version, action, author, sha256, size, mtime_ns,"
            " session_id, run_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (user_id, path, n, action, author, sha256, size, mtime_ns, session_id, run_id),
        )
        return dict(conn.execute(
            "SELECT * FROM file_versions WHERE user_id = ? AND path = ? AND version = ?", (user_id, path, n)
        ).fetchone())


def list_file_versions(user_id: str, path: str) -> list[dict]:
    """Newest first."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM file_versions WHERE user_id = ? AND path = ? ORDER BY version DESC", (user_id, path)
        ).fetchall()
    return [dict(r) for r in rows]


def get_file_version(user_id: str, path: str, version: int) -> dict | None:
    with get_conn() as conn:
        r = conn.execute(
            "SELECT * FROM file_versions WHERE user_id = ? AND path = ? AND version = ?", (user_id, path, version)
        ).fetchone()
    return dict(r) if r else None


def delete_file_versions(user_id: str, path: str, keep_from: int) -> None:
    """Drop this path's versions older than `keep_from` (retention)."""
    with get_conn() as conn:
        conn.execute("DELETE FROM file_versions WHERE user_id = ? AND path = ? AND version < ?",
                     (user_id, path, keep_from))


def referenced_hashes(user_id: str) -> set[str]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT DISTINCT sha256 FROM file_versions WHERE user_id = ? AND sha256 IS NOT NULL", (user_id,)
        ).fetchall()
    return {r["sha256"] for r in rows}


def set_file_version_action(user_id: str, path: str, version: int, action: str) -> None:
    with get_conn() as conn:
        conn.execute("UPDATE file_versions SET action = ? WHERE user_id = ? AND path = ? AND version = ?",
                     (action, user_id, path, version))
