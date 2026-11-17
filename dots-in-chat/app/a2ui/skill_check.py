"""Checks the a2ui skill (skills/a2ui/) against the catalogs, for every catalog at once.

    PYTHONPATH=. python -m app.a2ui.skill_check        # exit 1 and list what is wrong

1. The generated reference files are up to date (skill_build.stale).
2. Every component of every catalog (basic, VegaChart, chat blocks, macros) has its signature in a
   reference file, so the model can always learn how to write it.
3. SKILL.md names only reference files that exist.
4. Every `<a2ui>` example in SKILL.md and the references compiles against the catalogs, with
   nothing rejected, and the examples between them use every macro.
tests/test_a2ui_catalogs.py runs this, so a catalog change with a stale or wrong skill fails.
"""

import os
import re
import sys
import tempfile

if __name__ == "__main__":  # a throwaway database, never the app's: examples are compiled in a session
    os.environ["APP_DB_PATH"] = os.path.join(tempfile.mkdtemp(), "check.db")  # before app.config is imported

from app.a2ui import macros  # noqa: E402
from app.a2ui.catalog import CATALOGS  # noqa: E402
from app.a2ui.skill_build import REFERENCES, SKILL_DIR, stale  # noqa: E402

BLOCK = re.compile(r"<a2ui>\n.*?</a2ui>", re.DOTALL)
# The macros example is indented statements, one per line (the same text is in the prompt and the skill).
_BARE = re.compile(r"^ +(\w+ = .*)$", re.MULTILINE)


def _compiles(block: str) -> list[str]:
    from app import db
    from app.a2ui.turn import A2uiTurn

    db.init_db()
    user = db.create_user(f"check{os.urandom(3).hex()}@x.io", None, "x")
    turn = A2uiTurn(db.create_chat_session(user["id"], "check")["id"])
    turn.start_pass()
    turn.feed(block)
    turn.close()
    return turn.rejected


def check() -> list[str]:
    problems = [f"{name} is out of date: run PYTHONPATH=. python -m app.a2ui.skill_build" for name in stale()]

    texts = {p.name: p.read_text() for p in sorted(REFERENCES.glob("*.md"))}
    skill = (SKILL_DIR / "SKILL.md").read_text()
    corpus = "\n".join(texts.values())

    for catalog in CATALOGS:
        for name in catalog.components:
            if f"• {name}(" not in corpus:
                problems.append(f"{name} ({catalog.catalog_id}) has no signature in references/")

    for named in sorted(set(re.findall(r"references/([\w.-]+\.md)", skill))):
        if named not in texts:
            problems.append(f"SKILL.md names references/{named}, which does not exist")

    used: set[str] = set()
    for source, text in {"SKILL.md": skill, **texts}.items():
        for block in BLOCK.findall(text):
            used.update(re.findall(r"\b([A-Z]\w+)\(", block))
            if rejected := _compiles(block):
                problems.append(f"an example in {source} is rejected: {rejected[0][:200]}")
    # The macros' example is bare statements (it is shared by the prompt and the skill): wrap and compile.
    bare = "\n".join(_BARE.findall(macros.INSTRUCTIONS))
    if bare:
        used.update(re.findall(r"\b([A-Z]\w+)\(", bare))
        wrapped = f'<a2ui>\nsurface("check")\n{bare}\n</a2ui>'
        if rejected := _compiles(wrapped):
            problems.append(f"the macros example is rejected: {rejected[0][:200]}")
    for m in macros.MACROS:
        if m.__name__ not in used:
            problems.append(f"no example uses the macro {m.__name__}")
    return problems


def main() -> int:
    problems = check()
    for p in problems:
        print("-", p)
    print("a2ui skill: ok" if not problems else f"a2ui skill: {len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
