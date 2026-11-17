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
from app.a2ui.catalog import BASIC_COMPONENTS, BASIC_ID  # noqa: E402
from app.a2ui.skill_build import SKILL_DIR, build  # noqa: E402
from app.a2ui.store import parts_by_run  # noqa: E402
from app.a2ui.turn import A2uiTurn, fix_named_args  # noqa: E402

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


HALF_BAD = """<a2ui>
surface("tracker")
root = Column([budget, next])
budget = BudgetSplit(100000, [{label: "Rent", percent: 60}, {label: "Food", percent: 40}], title: "Monthly tracker", currency: "INR")
next = Suggestions("Adjust?", ["Rent 50%", "Save it"])
</a2ui>"""


def a2ui_kinds(events):
    return [k for n, d in events if n == "a2ui" for k in d["message"] if k != "version"]


class RobustnessTest(unittest.TestCase):
    """The pipeline a model's mistakes go through (all seen live: the chart never showed)."""

    def test_fix_named_args_only_touches_call_arguments(self):
        fixed = fix_named_args(HALF_BAD)
        self.assertIn('title="Monthly tracker", currency="INR"', fixed)
        self.assertIn('{label: "Rent", percent: 60}', fixed)  # map keys keep their colon
        text = 'Text("Note (see: here)")\nButton(Text("a: b"), "primary", Event("x", {k: $/f}))'
        self.assertEqual(fix_named_args(text), text)  # strings and maps are left alone
        self.assertEqual(fix_named_args('Card(child: x, weight: 1)'), 'Card(child=x, weight=1)')

    def test_a_block_whose_later_line_fails_sends_nothing_to_the_client(self):
        # Streaming used to emit the `root` surface before the failing line, leaving a surface
        # whose children were never defined (an empty card).
        for chunk in (3, 9, 1000):
            turn = A2uiTurn(new_session())
            events = run_reply(turn, "Here is your tracker.\n\n" + HALF_BAD, chunk=chunk)
            # The surface may have streamed before the failing line, but it is retracted.
            if chunk < 100:  # fed in one piece, nothing was shown before the error
                self.assertIn("a2ui_retract", [n for n, _ in events], chunk)
            self.assertFalse([p for p in turn.parts if p["type"] == "a2ui"], chunk)
            self.assertTrue(turn.rejected, chunk)
            self.assertEqual(turn.surface_ids, [], "the half-built surface must not stay in the state")

    def test_autofix_draws_the_block_with_no_model_call(self):
        turn = A2uiTurn(new_session())
        run_reply(turn, "Here is your tracker.\n\n" + HALF_BAD, chunk=5)
        events = turn.autofix()
        self.assertEqual(turn.rejected, [])
        self.assertIn("createSurface", a2ui_kinds(events))
        self.assertEqual(turn.surface_ids, ["tracker"])
        self.assertTrue(any(p["type"] == "a2ui" for p in turn.parts))

    def test_autofix_leaves_other_errors_and_keeps_the_original_for_the_repair_prompt(self):
        turn = A2uiTurn(new_session())
        run_reply(turn, '<a2ui>\nsurface("s")\nroot = Nope(title: "x")\n</a2ui>', chunk=4)
        self.assertEqual(turn.autofix() and None, None)
        self.assertTrue(turn.rejected)
        self.assertIn("Nope(title: \"x\")", turn.repair_prompt())  # what the model wrote, not the fix

    def test_a_good_block_before_a_bad_one_still_shows(self):
        good = '<a2ui>\nsurface("a")\nroot = Text("hello")\n</a2ui>\n'
        turn = A2uiTurn(new_session())
        events = run_reply(turn, good + '<a2ui>\nsurface("b")\nroot = Nope()\n</a2ui>', chunk=6)
        self.assertIn("createSurface", a2ui_kinds(events))
        self.assertEqual(turn.surface_ids, ["a"])  # b's half is gone

    def test_the_colon_error_has_a_fix_hint_and_give_up_adds_a_note(self):
        turn = A2uiTurn(new_session())
        run_reply(turn, '<a2ui>\nsurface("s")\nroot = Card(Text("x"), child: 1)\n</a2ui>')
        self.assertIn("name=value", turn.repair_prompt())
        note = turn.give_up()
        self.assertIn("couldn't draw", note[0][1]["content"])
        self.assertIn("couldn't draw", turn.parts[-1]["text"])


class VegaCheckTest(unittest.TestCase):
    def test_an_invalid_spec_is_rejected_with_its_path_and_a_pointer_to_the_recipes(self):
        # What a model wrote for "radar" (stored run): the chart drew nothing, the reply said it did.
        spec = ('{"data": {"values": [{"k": "A", "v": 1}]}, "coordinates": "polar", "encoding": {"theta": '
                '{"field": "k", "type": "nominal"}}, "layer": [{"mark": {"type": "line", "closed": true}}]}')
        turn = A2uiTurn(new_session())
        events = run_reply(turn, f'<a2ui>\nsurface("r")\nroot = Card(VegaChart({spec}, 300))\n</a2ui>')
        self.assertEqual(a2ui_kinds(events), [])
        self.assertIn("layer/0/mark", turn.rejected[0])
        prompt = turn.repair_prompt()
        self.assertIn("chart-choice.md", prompt)
        self.assertIn("Radar (one polygon", prompt)  # the working recipes ride along

    def test_valid_specs_and_vega_specs_pass(self):
        from app.a2ui import vegacheck

        ok = {"data": {"values": [{"a": 1}]}, "mark": "bar", "encoding": {"x": {"field": "a", "type": "quantitative"}}}
        self.assertIsNone(vegacheck.problem(ok))
        self.assertIsNone(vegacheck.problem({"marks": []}))  # full Vega: not checked
        self.assertIsNone(vegacheck.problem("/chart/spec"))  # a data binding: not checked
        self.assertIn("numeric", vegacheck.problem({**ok, "encoding": {"x": {"field": "a", "type": "numeric"}}}))


class PromptTest(unittest.TestCase):
    def test_skill_references_come_from_the_pruned_catalog(self):
        refs = build()
        self.assertIn("A2UI Express", refs["grammar.md"])
        self.assertIn("ChoicePicker(", refs["components.md"])
        for name in ("Modal(", "Video(", "AudioPlayer("):
            self.assertIn(name, refs["components.md"])
        self.assertIn("DateTimeInput", BASIC_COMPONENTS)
        self.assertIn("VegaChart(spec, height?)", refs["chart.md"])
        self.assertIn("When to show UI", (SKILL_DIR / "SKILL.md").read_text())


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
        self.assertNotIn("catalogId", created[0])  # mixed catalogs: each component names its own
        self.assertEqual({c["catalogId"] for c in created[0]["components"]}, {BASIC_ID})
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

    def test_redrawing_an_existing_surface_becomes_an_update(self):
        # Seen live ("make it 20 years"): `surface("<existing id>")` again was rejected and cost
        # a repair run. It now becomes surface(id, update=true), with no model call.
        session = new_session()
        first = A2uiTurn(session)
        run_reply(first, FORM_REPLY)
        first.save("run-1")
        again = A2uiTurn(session)
        events = run_reply(again, FORM_REPLY.replace('"2"]', '"1"]'), chunk=3)  # split mid-line
        self.assertEqual(again.rejected, [])
        kinds = {k for n, d in events if n == "a2ui" for k in d["message"] if k != "version"}
        self.assertNotIn("createSurface", kinds)

    def test_prose_streams_without_waiting_for_a_newline(self):
        turn = A2uiTurn(new_session())
        turn.start_pass()
        events = turn.feed("Paris is the capital")
        self.assertEqual(events, [("token", {"content": "Paris is the capital"})])


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

    def test_new_surface_does_not_delete_the_earlier_one(self):
        # Seen live: the model deleted the form/histogram whenever it showed a new card, so the
        # earlier message showed "This interface was removed".
        session = new_session()
        first = A2uiTurn(session)
        run_reply(first, FORM_REPLY)
        first.save("run-1")
        second = A2uiTurn(session)
        reply = CHART_REPLY.replace("<a2ui>\n", '<a2ui>\ndeleteSurface("trip_prefs")\n')
        events = run_reply(second, reply) + second.finish()
        self.assertEqual(second.rejected, [])
        kinds = [next(k for k in d["message"] if k != "version") for n, d in events if n == "a2ui"]
        self.assertNotIn("deleteSurface", kinds)
        second.save("run-2")
        self.assertEqual(sorted(A2uiTurn(session).surface_ids), ["growth", "trip_prefs"])

    def test_delete_only_turn_removes_the_surface(self):
        session = new_session()
        first = A2uiTurn(session)
        run_reply(first, FORM_REPLY)
        first.save("run-1")
        second = A2uiTurn(session)
        events = run_reply(second, '<a2ui>\ndeleteSurface("trip_prefs")\n</a2ui>\nRemoved it.')
        events += second.finish()
        kinds = [next(k for k in d["message"] if k != "version") for n, d in events if n == "a2ui"]
        self.assertEqual(kinds, ["deleteSurface"])
        second.save("run-2")
        self.assertEqual(A2uiTurn(session).surface_ids, [])

    def test_stored_replacing_delete_is_ignored_on_read(self):
        # Chats saved before the rule: the delete is in the database, but history and the
        # next turn's state skip it.
        session = new_session()
        first = A2uiTurn(session)
        run_reply(first, FORM_REPLY)
        first.save("run-1")
        delete = {"version": "v1.0", "deleteSurface": {"surfaceId": "trip_prefs"}}
        second = A2uiTurn(session)
        run_reply(second, CHART_REPLY)
        second.parts.insert(0, {"type": "a2ui", "message": delete})  # as stored before
        second.save("run-2")
        self.assertNotIn(delete, [p.get("message") for p in parts_by_run(session)["run-2"]])
        self.assertEqual(sorted(A2uiTurn(session).surface_ids), ["growth", "trip_prefs"])


class RootAliasTest(unittest.TestCase):
    def test_root_alias_is_rejected_so_the_prompt_forbids_it(self):
        # `root = card` compiles to nothing (seen live: "Surface not found"); the guide says so.
        turn = A2uiTurn(new_session())
        run_reply(turn, '<a2ui>\nsurface("s")\ncard = Card(Text("Hi"))\nroot = card\n</a2ui>')
        self.assertEqual(len(turn.rejected), 1)
        self.assertIn("root = card", (SKILL_DIR / "SKILL.md").read_text())


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
