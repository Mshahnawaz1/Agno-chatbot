"""Offline tests for the chat blocks (app/a2ui/catalogs/blocks/*.json).

Run from dots-in-chat/:
    PYTHONPATH=. python -m unittest tests.test_blocks -v

Each block's guide is what the model reads, so its Express example must compile as written.
No network: the model is never called.
"""

import asyncio
import json
import os
import re
import tempfile
import unittest

_tmp = tempfile.mkdtemp()
os.environ["APP_DB_PATH"] = os.path.join(_tmp, "app.db")  # before app.config is imported

from app import db  # noqa: E402
from app.a2ui.actions import action_prompt, read_action  # noqa: E402
from app.a2ui.catalog import BLOCK_COMPONENTS, CATALOGS_DIR  # noqa: E402
from app.a2ui.prompt import A2UI_INSTRUCTIONS  # noqa: E402
from app.a2ui.turn import A2uiTurn  # noqa: E402

db.init_db()

BLOCK_FILES = sorted((CATALOGS_DIR / "blocks").glob("*.json"))


def new_session() -> str:
    user = db.create_user(f"u{os.urandom(4).hex()}@x.io", None, "hash")
    return db.create_chat_session(user["id"], "t")["id"]


def compile_reply(reply: str, session: str | None = None) -> tuple[list, list[str]]:
    turn = A2uiTurn(session or new_session())
    turn.start_pass()
    events = turn.feed(reply) + turn.close()
    turn.save("run-" + os.urandom(3).hex())
    return events, turn.rejected


def example_of(guide: str) -> tuple[str, str]:
    """The guide's Express example: its statements and the first variable it assigns."""
    m = re.search(r"Example:\s*(.+)$", guide, re.S)
    assert m, "guide has no 'Example:'"
    code = m.group(1).strip()
    first = re.match(r"(\w+)\s*=", code)
    assert first, f"example doesn't start with an assignment: {code[:60]}"
    return code, first.group(1)


class BlockFilesTest(unittest.TestCase):
    def test_every_file_is_one_guide_and_its_components(self):
        self.assertTrue(BLOCK_FILES)
        for path in BLOCK_FILES:
            with self.subTest(path.name):
                doc = json.loads(path.read_text())
                self.assertEqual(set(doc), {"guide", "components"})
                for name, schema in doc["components"].items():
                    self.assertEqual(schema["properties"]["component"], {"const": name})
                    self.assertIn("component", schema["required"])
                    self.assertTrue(set(schema["required"]) <= set(schema["properties"]))
                    self.assertIn(name + "(", doc["guide"], "guide must show the signature")

    def test_prompt_lists_every_block(self):
        self.assertIn("Chat blocks:", A2UI_INSTRUCTIONS)
        for name in BLOCK_COMPONENTS:
            self.assertIn(f"• {name}(", A2UI_INSTRUCTIONS)


class BlockExamplesTest(unittest.TestCase):
    def test_every_guide_example_compiles(self):
        for path in BLOCK_FILES:
            guide = json.loads(path.read_text())["guide"]
            code, var = example_of(guide)
            with self.subTest(path.name):
                reply = f'Here.\n<a2ui>\nsurface("ex_{path.stem}")\nroot = Column([{var}])\n{code}\n</a2ui>'
                events, rejected = compile_reply(reply)
                self.assertEqual(rejected, [])
                created = [e for e in events if e[0] == "a2ui" and "createSurface" in e[1]["message"]]
                self.assertEqual(len(created), 1)

    def test_missing_required_prop_is_rejected(self):
        _, rejected = compile_reply('x\n<a2ui>\nsurface("bad")\nroot = Column([c])\nc = GrowthCalculator(10000)\n</a2ui>')
        self.assertTrue(rejected)

    def test_block_updates_in_place_with_new_props(self):
        session = new_session()
        _, rejected = compile_reply(
            'x\n<a2ui>\nsurface("sip")\nroot = Column([calc])\ncalc = GrowthCalculator(10000, 12, 15)\n</a2ui>', session
        )
        self.assertEqual(rejected, [])
        events, rejected = compile_reply(
            'Done.\n<a2ui>\nsurface("sip", update=true)\ncalc = GrowthCalculator(10000, 12, 20)\n</a2ui>', session
        )
        self.assertEqual(rejected, [])
        updates = [e[1]["message"] for e in events if e[0] == "a2ui"]
        self.assertTrue(any(c.get("years") == 20 for m in updates for c in m.get("updateComponents", {}).get("components", [])))


class SayActionTest(unittest.TestCase):
    def test_tapped_suggestion_reads_as_the_users_message_with_screen_state(self):
        message = {
            "version": "1.0",
            "action": {
                "name": "say", "surfaceId": "sip", "sourceComponentId": "next",
                "timestamp": "2026-11-16T10:00:00Z",
                "context": {"text": "Make it 20 years", "onScreen": {"calc": {"monthly": 15000, "years": 15}}},
            },
        }
        action = asyncio.run(read_action(message))
        prompt = action_prompt(action, ["sip"])
        self.assertIn('The user tapped the reply "Make it 20 years"', prompt)
        self.assertIn('"monthly": 15000', prompt)


if __name__ == "__main__":
    unittest.main()
