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
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, connector_id)
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
            "INSERT OR REPLACE INTO user_connectors (user_id, connector_id, credentials) VALUES (?, ?, ?)",
            (user_id, connector_id, credentials),
        )


def get_credentials(user_id: str, connector_id: str) -> str | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT credentials FROM user_connectors WHERE user_id = ? AND connector_id = ?",
            (user_id, connector_id),
        ).fetchone()
    return row["credentials"] if row else None


def list_connected(user_id: str) -> list[str]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT connector_id FROM user_connectors WHERE user_id = ?", (user_id,)
        ).fetchall()
    return [r["connector_id"] for r in rows]


def delete_credentials(user_id: str, connector_id: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "DELETE FROM user_connectors WHERE user_id = ? AND connector_id = ?",
            (user_id, connector_id),
        )
