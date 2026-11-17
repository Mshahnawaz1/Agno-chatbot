"""Scenario tests for mixed catalogs, macros and blueprints (server side).

Run from dots-in-chat/:
    PYTHONPATH=. python -m unittest tests.test_a2ui_catalogs -v
"""

import os
import tempfile
import unittest

_tmp = tempfile.mkdtemp()
os.environ["APP_DB_PATH"] = os.path.join(_tmp, "app.db")  # before app.config is imported

from app import db  # noqa: E402
from app.a2ui import catalog as cat  # noqa: E402
from app.a2ui import macros  # noqa: E402
from app.a2ui.store import load_state, save_parts  # noqa: E402
from app.a2ui.turn import A2uiTurn  # noqa: E402

db.init_db()


def session() -> str:
    user = db.create_user(f"u{os.urandom(4).hex()}@x.io", None, "hash")
    return db.create_chat_session(user["id"], "t")["id"]


def play(reply: str, turn: A2uiTurn | None = None, chunk: int = 11):
    """Streams a reply through a turn the way the SSE route does; returns (turn, messages)."""
    turn = turn or A2uiTurn(session())
    turn.start_pass()
    events = []
    for i in range(0, len(reply), chunk):
        events += turn.feed(reply[i : i + chunk])
    events += turn.close()
    return turn, [d["message"] for n, d in events if n == "a2ui"]


def components(messages) -> dict[str, dict]:
    return {c["id"]: c for m in messages for c in (m.get("createSurface") or m.get("updateComponents") or {}).get("components", [])}


MIXED = """Here is the plan.
<a2ui>
surface("mix")
root = Card(Column([title, chart, calc, next]))
title = Text("### Plan")
chart = VegaChart({"mark": "bar", "data": {"values": [{"a": "x", "b": 1}]}, "encoding": {"x": {"field": "a", "type": "nominal"}, "y": {"field": "b", "type": "quantitative"}}}, 200)
calc = GrowthCalculator(10000, 12, 15)
next = Suggestions("More?", ["Yes", "No"])
</a2ui>"""


class MixedCatalogsTest(unittest.TestCase):
    def test_three_catalogs_with_their_own_ids(self):
        self.assertEqual(
            cat.CATALOG_IDS,
            [
                "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json",
                "https://a2ui.org/specification/v1_0/catalogs/vegachart/catalog.json",
                "dots-in-chat/blocks/v1",
            ],
        )
        self.assertEqual(set(cat.BASIC.components) & set(cat.BLOCKS.components), set())
        self.assertEqual(set(cat.BASIC.components) & set(cat.VEGA.components), set())
        self.assertIn("Modal", cat.BASIC.components)  # the whole official basic catalog
        self.assertEqual(set(cat.BLOCKS.components), set(cat.BLOCK_COMPONENTS))

    def test_a_surface_mixes_catalogs_and_each_component_names_its_own(self):
        turn, messages = play(MIXED)
        self.assertEqual(turn.rejected, [])
        create = messages[0]["createSurface"]
        self.assertNotIn("catalogId", create, "a surface has no catalog of its own")
        by_id = components(messages)
        self.assertEqual(by_id["root"]["catalogId"], cat.BASIC_ID)
        self.assertEqual(by_id["chart"]["catalogId"], cat.VEGA_ID)
        self.assertEqual(by_id["calc"]["catalogId"], cat.BLOCKS_ID)
        self.assertEqual(by_id["next"]["catalogId"], cat.BLOCKS_ID)
        self.assertEqual(by_id["title"]["catalogId"], cat.BASIC_ID)

    def test_each_catalog_validates_its_own_components(self):
        bad = {
            "chart without spec": 'root = VegaChart()',
            "block with a wrong type": 'root = GrowthCalculator("lots", 12, 15)',
            "unknown component": 'root = Gauge(3)',
            "modal without content": 'root = Modal(Text("x"))',
        }
        for label, line in bad.items():
            with self.subTest(label):
                turn, messages = play(f'<a2ui>\nsurface("bad")\n{line}\n</a2ui>')
                self.assertTrue(turn.rejected, label)
                self.assertEqual(messages, [], label)

    def test_a_catalog_the_renderer_does_not_list_is_not_available(self):
        only_basic = cat.GENERATOR.create_processor({cat.PROTOCOL_VERSION: {"supportedCatalogIds": [cat.BASIC_ID]}})
        self.assertEqual([c.catalog_id for c in only_basic.active_catalogs], [cat.BASIC_ID])
        self.assertNotIn("GrowthCalculator", only_basic.prompt_snippet)
        self.assertIn("GrowthCalculator", cat.new_processor().prompt_snippet)

    def test_the_prompt_lists_every_catalog(self):
        snippet = cat.new_processor().prompt_snippet
        for catalog_id in cat.CATALOG_IDS:
            self.assertIn(f"# Catalog `{catalog_id}`", snippet)

    def test_modal_video_and_audio_compile(self):
        reply = (
            '<a2ui>\nsurface("media")\nroot = Column([clip, song, more])\n'
            'clip = Video("https://example.com/a.mp4", "https://example.com/a.png")\n'
            'song = AudioPlayer("https://example.com/a.mp3", "Theme")\n'
            'more = Modal(open, body)\nopen = Button(Text("Details"), "borderless", Event("noop"))\n'
            'body = Text("Hello")\n</a2ui>'
        )
        turn, messages = play(reply)
        self.assertEqual(turn.rejected, [])
        self.assertEqual({components(messages)[k]["component"] for k in ("clip", "song", "more")}, {"Video", "AudioPlayer", "Modal"})


MACRO_REPLY = """<a2ui>
surface("dash")
root = Card(Column([stats, row, tip, ask]))
stats = Row([StatTile("Saved", "₹12,400", "up 8%"), StatTile("Goal", "₹50,000")])
row = InfoRow("Check-in", "14 March")
tip = Callout("Heads up", "Prices change daily.", "warning")
ask = ConfirmBar("Send these 3 emails?", Event("confirm_send", {n: 3}), Event("cancel_send"), "Send")
</a2ui>"""


class MacrosTest(unittest.TestCase):
    """Macros are expanded on the server: the client only ever sees basic components."""

    def test_macros_are_a_catalog_the_model_sees_but_the_renderer_does_not(self):
        self.assertEqual(cat.MODEL_CATALOG_IDS, [*cat.CATALOG_IDS, macros.MACROS_ID])
        self.assertEqual(set(cat.MACRO_CATALOG.components), {"StatTile", "InfoRow", "Callout", "ConfirmBar"})
        self.assertIn(f"# Catalog `{macros.MACROS_ID}`", cat.new_processor().prompt_snippet)

    def test_macro_calls_reach_the_client_as_basic_components(self):
        turn, messages = play(MACRO_REPLY)
        self.assertEqual(turn.rejected, [])
        by_id = components(messages)
        names = {c["component"] for c in by_id.values()}
        self.assertTrue(names <= set(cat.BASIC.components), names)
        self.assertEqual({c["catalogId"] for c in by_id.values()}, {cat.BASIC_ID})
        # the macro call's id stays on the root of its subtree; the parts get derived ids
        self.assertEqual(by_id["row"]["component"], "Row")
        self.assertIn("ask__button_1", by_id)
        button = by_id["ask__button_1"]
        self.assertEqual(by_id[button["child"]]["text"], "Send")
        self.assertEqual(button["action"], {"event": {"name": "confirm_send", "context": {"n": 3}}})
        self.assertEqual(by_id["tip__row_1"]["children"][0], "tip__icon_1")
        self.assertEqual(by_id["tip__icon_1"]["name"], "warning")

    def test_a_macro_line_is_much_shorter_than_what_it_expands_to(self):
        import json

        turn, messages = play(MACRO_REPLY)
        written = MACRO_REPLY.split("\n", 2)[2]
        self.assertGreater(len(json.dumps(messages)), 5 * len(written))

    def test_bad_macro_arguments_are_rejected_by_the_catalog(self):
        for line in ('root = Callout("a", "b", "loud")', 'root = ConfirmBar("q")', 'root = StatTile()'):
            with self.subTest(line):
                turn, messages = play(f'<a2ui>\nsurface("m")\n{line}\n</a2ui>')
                self.assertTrue(turn.rejected)
                self.assertEqual(messages, [])

    def test_a_later_turn_replaces_a_macro_by_writing_it_again(self):
        sid = session()
        first, _ = play(MACRO_REPLY, A2uiTurn(sid))
        first.save("run-1")
        turn, messages = play(
            '<a2ui>\nsurface("dash", update=true)\ntip = Callout("Done", "Prices are fixed now.", "success")\n</a2ui>',
            A2uiTurn(sid),
        )
        self.assertEqual(turn.rejected, [])
        by_id = components(messages)
        self.assertEqual(by_id["tip"]["component"], "Card")
        self.assertEqual(by_id["tip__icon_1"]["name"], "check")
        self.assertEqual(by_id["tip__text_2"]["text"], "Prices are fixed now.")
        # what was stored is what the client saw: basic only, so the next turn can rebuild it
        names = {c["component"] for m in [p["message"] for p in first.parts if p["type"] == "a2ui"] for c in components([m]).values()}
        self.assertTrue(names <= set(cat.BASIC.components))
        self.assertEqual(load_state(sid, cat.new_processor()).surface_ids, ["dash"])

    def test_stored_expansions_raise_back_to_the_call(self):
        _, messages = play(MACRO_REPLY)
        by_id = components([macros.raise_message(m) for m in messages])
        self.assertEqual(by_id["tip"]["component"], "Callout")
        self.assertEqual(by_id["ask"]["on_confirm"], {"event": {"name": "confirm_send", "context": {"n": 3}}})
        self.assertFalse([i for i in by_id if "__" in i], "expansion parts must be gone")


class SkillCheckTest(unittest.TestCase):
    def test_the_skill_matches_every_catalog(self):
        from app.a2ui.skill_check import check

        self.assertEqual(check(), [])

    def test_the_check_notices_an_undocumented_component(self):
        from app.a2ui import skill_check

        from types import SimpleNamespace

        original = skill_check.CATALOGS
        skill_check.CATALOGS = [*original, SimpleNamespace(catalog_id="x", components={"Ghost": object()})]
        try:
            self.assertTrue([p for p in skill_check.check() if "Ghost" in p])
        finally:
            skill_check.CATALOGS = original


class StoredSurfacesTest(unittest.TestCase):
    """Surfaces stored before mixed catalogs name the one merged catalog id."""

    LEGACY = {
        "version": "1.0",
        "createSurface": {
            "surfaceId": "old",
            "catalogId": cat.CATALOG_ID,
            "components": [
                {"id": "root", "component": "Column", "children": ["calc", "t"]},
                {"id": "calc", "component": "GrowthCalculator", "monthly": 5000, "rate": 10, "years": 10},
                {"id": "t", "component": "Text", "text": "hi"},
            ],
        },
    }

    def test_upgrade_moves_the_catalog_to_each_component(self):
        new = cat.upgrade_message(self.LEGACY)
        self.assertNotIn("catalogId", new["createSurface"])
        ids = {c["id"]: c["catalogId"] for c in new["createSurface"]["components"]}
        self.assertEqual(ids, {"root": cat.BASIC_ID, "calc": cat.BLOCKS_ID, "t": cat.BASIC_ID})
        self.assertIs(cat.upgrade_message({"version": "1.0", "deleteSurface": {"surfaceId": "x"}})["deleteSurface"]["surfaceId"], "x")

    def test_a_later_turn_updates_a_legacy_surface(self):
        sid = session()
        save_parts(sid, "r0", [{"type": "a2ui", "message": self.LEGACY}])
        self.assertEqual(load_state(sid, cat.new_processor()).surface_ids, ["old"])
        turn, messages = play('<a2ui>\nsurface("old", update=true)\ncalc = GrowthCalculator(5000, 10, 20)\n</a2ui>', A2uiTurn(sid))
        self.assertEqual(turn.rejected, [])
        self.assertEqual(components(messages)["calc"]["years"], 20)
        self.assertEqual(components(messages)["calc"]["catalogId"], cat.BLOCKS_ID)


if __name__ == "__main__":
    unittest.main()
