"""Offline tests for app/a2ui: compiling a reply, storing it, later turns, actions.

Run from dots-in-chat/:
    PYTHONPATH=. python -m unittest tests.test_a2ui -v

No network: the model is never called; replies are written here as the model would write them.
"""

import asyncio
import os
import tempfile
import unittest

_tmp = tempfile.mkdtemp()
os.environ["APP_DB_PATH"] = os.path.join(_tmp, "app.db")  # before app.config is imported

from app import db  # noqa: E402
from app.a2ui.actions import InvalidAction, action_prompt, parse_action_prompt, read_action  # noqa: E402
from app.a2ui.catalog import BASIC_COMPONENTS, CATALOG_ID  # noqa: E402
from app.a2ui.prompt import A2UI_INSTRUCTIONS  # noqa: E402
from app.a2ui.store import parts_by_run  # noqa: E402
from app.a2ui.turn import A2uiTurn  # noqa: E402

db.init_db()

FORM_REPLY = """Tell me a bit about the trip.
<a2ui>
surface("trip_prefs")
$/form/name = ""
$/form/days = ["2"]
root = Card(Column([title, nameField, daysPicker, go]))
title = Text("### Weekend trip")
nameField = TextField("Your name", $/form/name, checks=[?required("Please add your name")])
daysPicker = ChoicePicker(label="Duration", options=[{label: "1 day", value: "1"}, {label: "2 days", value: "2"}], value=$/form/days)
go = Button(Text("Plan my trip"), "primary", Event("plan_trip", {name: $/form/name, days: $/form/days}))
</a2ui>
Press the button when ready."""

UPDATE_REPLY = """Changed it to three days.
<a2ui>
surface("trip_prefs", update=true)
$/form/days = ["3"]
</a2ui>"""

BAD_REPLY = """Here you go.
<a2ui>
surface("bad")
root = Text("### Hi", "h3")
</a2ui>"""


def new_session() -> str:
    user = db.create_user(f"u{os.urandom(4).hex()}@x.io", None, "hash")
    return db.create_chat_session(user["id"], "t")["id"]


def run_reply(turn: A2uiTurn, reply: str, chunk: int = 7) -> list[tuple[str, dict]]:
    """Feeds a reply in small chunks, as a model stream would arrive."""
    turn.start_pass()
    events = []
    for i in range(0, len(reply), chunk):
        events += turn.feed(reply[i:i + chunk])
    return events + turn.close()


class PromptTest(unittest.TestCase):
    def test_prompt_is_generated_from_the_pruned_catalog(self):
        self.assertIn("A2UI Express", A2UI_INSTRUCTIONS)
        self.assertIn("When to show UI", A2UI_INSTRUCTIONS)
        self.assertIn("ChoicePicker", A2UI_INSTRUCTIONS)
        self.assertNotIn("AudioPlayer(", A2UI_INSTRUCTIONS)
        self.assertIn("DateTimeInput", BASIC_COMPONENTS)
        self.assertIn("VegaChart(spec, height?)", A2UI_INSTRUCTIONS)


class TurnTest(unittest.TestCase):
    def test_form_reply_compiles_to_v1_messages(self):
        turn = A2uiTurn(new_session())
        events = run_reply(turn, FORM_REPLY)
        kinds = [name for name, _ in events]
        self.assertNotIn("a2ui_error", kinds)
        messages = [data["message"] for name, data in events if name == "a2ui"]
        self.assertTrue(messages)
        self.assertTrue(all(m["version"] == "1.0" for m in messages))
        created = [m["createSurface"] for m in messages if "createSurface" in m]
        self.assertEqual(created[0]["surfaceId"], "trip_prefs")
        self.assertEqual(created[0]["catalogId"], CATALOG_ID)
        text = "".join(data["content"] for name, data in events if name == "token")
        self.assertIn("Tell me a bit about the trip.", text)
        self.assertNotIn("<a2ui>", text)
        self.assertEqual(turn.surface_ids, ["trip_prefs"])

    def test_rejected_block_never_reaches_the_client(self):
        turn = A2uiTurn(new_session())
        events = run_reply(turn, BAD_REPLY)
        # Statements compile one by one: the surface is created, the invalid Text is held back.
        sent = [d["message"] for n, d in events if n == "a2ui"]
        self.assertFalse([m for m in sent if "updateComponents" in m])
        self.assertEqual(len(turn.rejected), 1)
        self.assertIn("h3", turn.rejected[0])
        self.assertIn("- ", turn.repair_prompt())

    def test_later_turn_updates_a_stored_surface(self):
        session = new_session()
        first = A2uiTurn(session)
        run_reply(first, FORM_REPLY)
        first.save("run-1")

        # A new request rebuilds the state from the database.
        second = A2uiTurn(session)
        self.assertEqual(second.surface_ids, ["trip_prefs"])
        events = run_reply(second, UPDATE_REPLY)
        self.assertEqual(second.rejected, [])
        updates = [d["message"]["updateDataModel"] for n, d in events if n == "a2ui"]
        self.assertEqual(updates, [{"surfaceId": "trip_prefs", "path": "/form/days", "value": ["3"]}])
        second.save("run-2")

        stored = parts_by_run(session)
        self.assertEqual(list(stored), ["run-1", "run-2"])
        self.assertEqual(stored["run-1"][0], {"type": "text", "text": "Tell me a bit about the trip."})
        self.assertEqual(stored["run-2"][-1]["type"], "a2ui")

    def test_recreating_an_existing_surface_is_rejected(self):
        session = new_session()
        first = A2uiTurn(session)
        run_reply(first, FORM_REPLY)
        first.save("run-1")
        again = A2uiTurn(session)
        run_reply(again, FORM_REPLY)
        self.assertEqual(len(again.rejected), 1)


CHART_REPLY = """A live growth curve.
<a2ui>
surface("growth")
root = Card(Column([title, chart]))
title = Text("### Growth")
chart = VegaChart({"params": [{"name": "monthly", "value": 5000, "bind": {"input": "range", "min": 500, "max": 50000}}], "data": {"sequence": {"start": 1, "stop": 13, "as": "month"}}, "transform": [{"calculate": "monthly * datum.month", "as": "invested"}], "mark": "line", "encoding": {"x": {"field": "month", "type": "quantitative"}, "y": {"field": "invested", "type": "quantitative"}}}, 300)
</a2ui>"""


class ChartTest(unittest.TestCase):
    def test_vegachart_compiles_with_its_spec(self):
        turn = A2uiTurn(new_session())
        events = run_reply(turn, CHART_REPLY)
        self.assertEqual(turn.rejected, [])
        # Streamed, a component may come with createSurface or in a later updateComponents.
        components = [
            c for n, d in events if n == "a2ui"
            for key in ("createSurface", "updateComponents")
            for c in d["message"].get(key, {}).get("components", [])
        ]
        chart = [c for c in components if c["component"] == "VegaChart"][-1]
        self.assertEqual(chart["spec"]["params"][0]["bind"]["input"], "range")
        self.assertEqual(chart["height"], 300)

    def test_layout_change_is_delete_and_new_surface_in_one_block(self):
        session = new_session()
        first = A2uiTurn(session)
        run_reply(first, FORM_REPLY)
        first.save("run-1")
        second = A2uiTurn(session)
        reply = CHART_REPLY.replace("<a2ui>\n", '<a2ui>\ndeleteSurface("trip_prefs")\n')
        events = run_reply(second, reply)
        self.assertEqual(second.rejected, [])
        kinds = [next(k for k in d["message"] if k != "version") for n, d in events if n == "a2ui"]
        self.assertEqual(kinds[0], "deleteSurface")
        self.assertEqual(second.surface_ids, ["growth"])


class RootAliasTest(unittest.TestCase):
    def test_root_alias_is_rejected_so_the_prompt_forbids_it(self):
        # `root = card` compiles to nothing (seen live: "Surface not found"); the guide says so.
        turn = A2uiTurn(new_session())
        run_reply(turn, '<a2ui>\nsurface("s")\ncard = Card(Text("Hi"))\nroot = card\n</a2ui>')
        self.assertEqual(len(turn.rejected), 1)
        self.assertIn("root = card", A2UI_INSTRUCTIONS)


class ActionTest(unittest.TestCase):
    ACTION = {
        "version": "1.0",
        "action": {
            "name": "plan_trip", "surfaceId": "trip_prefs", "sourceComponentId": "go",
            "timestamp": "2026-11-16T10:00:00Z", "context": {"name": "Asha", "days": ["2"]},
        },
    }

    def test_valid_action_becomes_the_turn_input(self):
        action = asyncio.run(read_action(self.ACTION))
        self.assertEqual(action["name"], "plan_trip")
        prompt = action_prompt(action, ["trip_prefs"])
        self.assertTrue(prompt.startswith("User action: "))
        self.assertIn("Surfaces that exist now: trip_prefs", prompt)
        self.assertEqual(parse_action_prompt(prompt)["context"], {"name": "Asha", "days": ["2"]})

    def test_malformed_action_is_refused(self):
        with self.assertRaises(InvalidAction):
            asyncio.run(read_action({"version": "1.0", "action": {"name": "x"}}))

    def test_typed_message_is_not_an_action(self):
        self.assertIsNone(parse_action_prompt("Plan my trip"))


if __name__ == "__main__":
    unittest.main()
