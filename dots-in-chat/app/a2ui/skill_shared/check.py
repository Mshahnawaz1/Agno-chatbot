#!/usr/bin/env python3
"""Checks an A2UI Express block before it is sent: compiles it exactly as the chat server will.

    check.py "<a2ui> ... </a2ui>"

The block is compiled against the chat's real surfaces (A2UI_SESSION_ID, set by the skill
runner in app/skills.py), so updates of earlier surfaces are checked too. Prints OK and what the
block does, or each error with a fix hint; exit code 1 on errors.
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]  # dots-in-chat/
sys.path.insert(0, str(ROOT))
os.chdir(ROOT)  # the app's relative data paths

from app import db  # noqa: E402
from app.a2ui.turn import A2uiTurn, _hint  # noqa: E402

db.init_db()  # idempotent; a fresh database (tests) has no tables yet


def check(block: str, session_id: str) -> tuple[bool, str]:
    if "<a2ui>" not in block:
        block = f"<a2ui>\n{block.strip()}\n</a2ui>"
    turn = A2uiTurn(session_id)
    before = set(turn.surface_ids)
    turn.start_pass()
    events = turn.feed(block) + turn.close()
    if turn.rejected:
        lines = [f"- {e[:600]}{_hint(e)}" for e in turn.rejected]
        return False, "ERRORS (fix them, then check again):\n" + "\n".join(lines)

    done = []
    for name, data in events:
        msg = data.get("message", {}) if name == "a2ui" else {}
        for kind in ("createSurface", "deleteSurface"):
            if kind in msg:
                done.append(f"{kind} {msg[kind]['surfaceId']}")
    updated = sorted({
        data["message"][k]["surfaceId"] for name, data in events if name == "a2ui"
        for k in ("updateComponents", "updateDataModel") if k in data["message"]
    } & before)
    done += [f"update {s}" for s in updated]
    if not done:
        return False, "ERRORS:\n- The block produced no UI. Is root assigned, and is it inside <a2ui> tags?"
    return True, "OK: " + "; ".join(dict.fromkeys(done)) + ". Send this block unchanged."


if __name__ == "__main__":
    text = " ".join(sys.argv[1:]) or sys.stdin.read()
    if not text.strip():
        print("Usage: check.py '<a2ui> ... </a2ui>'")
        sys.exit(2)
    ok, report = check(text, os.environ.get("A2UI_SESSION_ID", "check-only"))
    print(report)
    sys.exit(0 if ok else 1)
