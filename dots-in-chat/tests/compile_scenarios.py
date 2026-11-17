"""Compiles Express replies the way the chat server does and prints JSON for frontend/e2e/pipeline.mjs.

    PYTHONPATH=. python tests/compile_scenarios.py > out.json

Each scenario: {name, reply, expect: [text the rendered page must contain], expect_not: [...]}.
Output per scenario: the A2UI messages in the order the server would send them (one SSE event each),
plus any compile errors.
"""

import json
import os
import sys
import tempfile

os.environ.setdefault("APP_DB_PATH", os.path.join(tempfile.mkdtemp(), "app.db"))
os.environ.setdefault("JWT_SECRET", "test-only")
os.environ.setdefault("CONNECTOR_SECRET", "test-only")
sys.path.insert(0, os.getcwd())

from app import db  # noqa: E402
from app.a2ui.turn import A2uiTurn  # noqa: E402

db.init_db()

SCENARIOS = [
    {
        "name": "text and data binding",
        "reply": '<a2ui>\nsurface("s1")\n$/name = "Ada"\nroot = Card(Text("### Hello ${/name}"))\n</a2ui>',
        "expect": ["Hello"],
    },
    {
        "name": "template list with @index offset",
        "reply": '<a2ui>\nsurface("s2")\n$/people = [{n: "Ann"}, {n: "Bob"}, {n: "Cy"}]\nroot = List(_template($/people, row))\nrow = Text($n)\n</a2ui>',
        "expect": ["Ann", "Bob", "Cy"],
    },
    {
        "name": "@index() as the whole text",
        "reply": '<a2ui>\nsurface("s3")\n$/p = [{n: "A"}, {n: "B"}]\nroot = List(_template($/p, row))\nrow = Text(@index(1))\n</a2ui>',
        "expect": ["1", "2"],
    },
    {
        "name": "form with checks, button gated",
        "reply": (
            '<a2ui>\nsurface("s4")\n$/e = ""\nroot = Card(Column([f, go]))\n'
            'f = TextField("Email", $/e, checks=[?required("Email is required"), ?email("Not an email")])\n'
            'go = Button(Text("Send"), "primary", Event("send", {e: $/e}), checks=[?email($/e, "Fix the email")])\n</a2ui>'
        ),
        "expect": ["Email", "Send"],
    },
    {
        "name": "progressive: two blocks, second updates the first",
        "reply": (
            'First.\n<a2ui>\nsurface("s5")\nroot = Column([a])\na = Text("one")\n</a2ui>\n'
            'Then.\n<a2ui>\nsurface("s5", update=true)\nroot = Column([a, b])\nb = Text("two")\n</a2ui>'
        ),
        "expect": ["one", "two"],
    },
    {
        "name": "chart block",
        "reply": '<a2ui>\nsurface("s6")\nroot = Card(Column([t, c]))\nt = Text("### Bars")\nc = VegaChart({"data": {"values": [{"a": "x", "b": 1}, {"a": "y", "b": 3}]}, "mark": "bar", "encoding": {"x": {"field": "a", "type": "nominal"}, "y": {"field": "b", "type": "quantitative"}}}, 200)\n</a2ui>',
        "expect": ["Bars"],
    },
]


def main() -> None:
    out = []
    for sc in SCENARIOS:
        user = db.create_user(f"u{os.urandom(4).hex()}@x.io", None, "hash")
        turn = A2uiTurn(db.create_chat_session(user["id"], "t")["id"])
        turn.start_pass()
        events = []
        for i in range(0, len(sc["reply"]), 5):
            events += turn.feed(sc["reply"][i : i + 5])
        events += turn.close()
        out.append({
            **sc,
            "messages": [d["message"] for n, d in events if n == "a2ui"],
            "errors": [str(d) for n, d in events if n == "a2ui_error"],
        })
    json.dump(out, sys.stdout)


if __name__ == "__main__":
    main()
