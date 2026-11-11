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