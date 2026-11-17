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
