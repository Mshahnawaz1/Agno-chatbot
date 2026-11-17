"""Progressive rendering: a surface appears while the model is still streaming, and a failing
block still leaves no half-built surface.

Run from dots-in-chat/:
    PYTHONPATH=. python -m unittest tests.test_a2ui_progressive -v

Each scenario feeds a reply as a model stream would arrive (chunks cut anywhere, inside strings,
JSON and Express) and watches the events a client would get. `Client` replays them the way the
frontend does: a2ui messages are kept, `a2ui_retract` drops a surface's messages.
"""

import json
import unittest

from tests.test_a2ui import CHART_REPLY, FORM_REPLY, HALF_BAD, A2uiTurn, new_session

CLOSE = "</a2ui>"


class Client:
    """What the chat page holds: the a2ui messages not retracted, and the text."""

    def __init__(self):
        self.messages: list[dict] = []
        self.text = ""

    def apply(self, events):
        for name, data in events:
            if name == "a2ui":
                self.messages.append(data["message"])
            elif name == "a2ui_retract":
                sid = data["surfaceId"]
                self.messages = [m for m in self.messages if _surface_of(m) != sid]
            elif name == "token":
                self.text += data["content"]

    def components(self, surface_id: str) -> list[str]:
        """Ids of the components defined for the surface, in arrival order. The SDK re-sends a
        component as it grows, and adds ids of its own (`root_child`); the sets below ignore both."""
        out = []
        for m in self.messages:
            if _surface_of(m) == surface_id:
                body = m.get("createSurface") or m.get("updateComponents") or {}
                out += [c["id"] for c in body.get("components", [])]
        return list(dict.fromkeys(out))

    def surfaces(self) -> list[str]:
        return [m["createSurface"]["surfaceId"] for m in self.messages if "createSurface" in m]


def _surface_of(message: dict) -> str | None:
    return next((v.get("surfaceId") for k, v in message.items() if isinstance(v, dict)), None)


def chunks(text: str, size: int):
    return [text[i : i + size] for i in range(0, len(text), size)]


def stream(turn: A2uiTurn, pieces, client: Client | None = None):
    """Feeds the pieces; returns (events per piece, client)."""
    client = client or Client()
    turn.start_pass()
    seen = []
    for piece in pieces:
        events = turn.feed(piece)
        client.apply(events)
        seen.append(events)
    tail = turn.close()
    client.apply(tail)
    seen.append(tail)
    return seen, client


def first_piece_with(seen, kind: str) -> int | None:
    for i, events in enumerate(seen):
        if any(n == "a2ui" and kind in d["message"] for n, d in events):
            return i
    return None


class ProgressiveTest(unittest.TestCase):
    def test_components_arrive_before_the_block_ends(self):
        pieces = chunks(FORM_REPLY, 5)
        end = next(i for i, _ in enumerate(pieces) if CLOSE in "".join(pieces[: i + 1]))
        seen, client = stream(A2uiTurn(new_session()), pieces)
        first = first_piece_with(seen, "createSurface")
        self.assertIsNotNone(first)
        self.assertLess(first, end, "the surface must start before `</a2ui>` was received")
        # ...and components keep arriving one statement at a time, not all at the end.
        pieces_with_components = [i for i, ev in enumerate(seen) if any(n == "a2ui" for n, _ in ev)]
        self.assertGreater(len(pieces_with_components), 2)
        self.assertLess(pieces_with_components[-1], end + 1)
        self.assertTrue({"root", "title", "nameField", "daysPicker", "go"} <= set(client.components("trip_prefs")))

    def test_a_component_is_visible_as_soon_as_its_line_is_complete(self):
        reply = '<a2ui>\nsurface("s")\nroot = Column([a, b])\na = Text("first")\nb = Text("second")\n</a2ui>'
        turn = A2uiTurn(new_session())
        turn.start_pass()
        client = Client()
        client.apply(turn.feed('<a2ui>\nsurface("s")\nroot = Column([a, b])\na = Text("first")\n'))
        self.assertIn("a", client.components("s"))
        self.assertNotIn("b", client.components("s"))
        client.apply(turn.feed('b = Text("second")\n'))
        client.apply(turn.feed("</a2ui>"))
        client.apply(turn.close())
        self.assertTrue({"a", "b", "root"} <= set(client.components("s")))
        self.assertEqual(turn.rejected, [])
        del reply

    def test_every_chunk_size_gives_the_same_final_surface(self):
        # Chunk boundaries fall inside the JSON spec, strings, `surface(` and `</a2ui>`.
        reference = None
        for size in list(range(1, 40)) + [97, 500, 5000]:
            turn = A2uiTurn(new_session())
            _, client = stream(turn, chunks(CHART_REPLY, size))
            self.assertEqual(turn.rejected, [], size)
            final = json.dumps(client.messages, sort_keys=True)
            self.assertEqual(client.surfaces(), ["growth"], size)
            self.assertTrue({"chart", "root", "title"} <= set(client.components("growth")), size)
            chart = next(
                c for m in client.messages for c in (m.get("updateComponents") or m.get("createSurface") or {}).get("components", [])
                if c["id"] == "chart"
            )
            self.assertEqual(chart["height"], 300, size)
            if reference is None:
                reference = client.text
            self.assertEqual(client.text, reference, size)
            self.assertNotIn("<a2ui>", client.text)
            del final

    def test_prose_around_a_block_keeps_its_order(self):
        turn = A2uiTurn(new_session())
        stream(turn, chunks(FORM_REPLY, 4))
        kinds = [p["type"] for p in turn.parts]
        self.assertEqual(kinds[0], "text")
        self.assertIn("a2ui", kinds)
        self.assertEqual(kinds[-1], "text")
        self.assertEqual(turn.parts[-1]["text"].strip(), "Press the button when ready.")


class FailingBlockTest(unittest.TestCase):
    def test_a_block_failing_after_its_surface_streamed_is_retracted(self):
        for size in (1, 3, 8, 40, 2000):
            turn = A2uiTurn(new_session())
            seen, client = stream(turn, chunks("Here is your tracker.\n\n" + HALF_BAD, size))
            names = [n for ev in seen for n, _ in ev]
            self.assertIn("a2ui_error", names, size)
            self.assertEqual(client.surfaces(), [], size)
            self.assertEqual(client.messages, [], size)
            self.assertFalse([p for p in turn.parts if p["type"] == "a2ui"], size)
            self.assertEqual(turn.surface_ids, [], size)
            self.assertEqual(client.text.strip(), "Here is your tracker.", size)

    def test_it_really_was_shown_before_it_failed(self):
        # The point of the retraction: with small chunks the surface streamed first.
        seen, _ = stream(A2uiTurn(new_session()), chunks(HALF_BAD, 4))
        shown = first_piece_with(seen, "createSurface")
        retract = next(i for i, ev in enumerate(seen) if any(n == "a2ui_retract" for n, _ in ev))
        self.assertIsNotNone(shown)
        self.assertLess(shown, retract)

    def test_the_rest_of_a_failed_block_is_ignored(self):
        reply = (
            '<a2ui>\nsurface("s")\nroot = Column([a, b])\na = Nope()\nb = Text("fine")\n</a2ui>\n'
            'After.'
        )
        turn = A2uiTurn(new_session())
        _, client = stream(turn, chunks(reply, 3))
        self.assertEqual(client.messages, [])
        self.assertEqual(turn.surface_ids, [])
        self.assertTrue(turn.rejected)

    def test_repair_after_a_partial_render_draws_the_surface_once(self):
        turn = A2uiTurn(new_session())
        client = Client()
        stream(turn, chunks("Here.\n" + HALF_BAD.replace("title:", "title ="), 6), client)  # a different error
        self.assertEqual(client.surfaces(), [])
        self.assertTrue(turn.rejected)
        # The repair run writes the surface again under the same id (it does not exist any more).
        fixed = HALF_BAD.replace('title: "Monthly tracker", currency: "INR"', 'title="Monthly tracker", currency="INR"')
        turn.start_pass()
        for piece in chunks(fixed, 6):
            client.apply(turn.feed(piece))
        client.apply(turn.close())
        self.assertEqual(turn.rejected, [])
        self.assertEqual(client.surfaces(), ["tracker"])
        self.assertEqual(len([p for p in turn.parts if p["type"] == "a2ui" and "createSurface" in p["message"]]), 1)
        self.assertTrue({"budget", "next", "root"} <= set(client.components("tracker")))

    def test_autofix_after_a_partial_render(self):
        turn = A2uiTurn(new_session())
        client = Client()
        stream(turn, chunks("Here is your tracker.\n\n" + HALF_BAD, 5), client)
        self.assertEqual(client.surfaces(), [])  # retracted
        client.apply(turn.autofix())
        self.assertEqual(turn.rejected, [])
        self.assertEqual(client.surfaces(), ["tracker"])
        self.assertTrue({"budget", "next", "root"} <= set(client.components("tracker")))

    def test_an_invalid_chart_spec_after_the_surface_streamed_is_retracted(self):
        bad = CHART_REPLY.replace('"mark": "line"', '"mark": {"type": "line", "closed": true}')
        turn = A2uiTurn(new_session())
        _, client = stream(turn, chunks(bad, 9))
        self.assertTrue(turn.rejected)
        self.assertEqual(client.messages, [])
        self.assertEqual(turn.surface_ids, [])

    def test_a_stream_cut_inside_a_block_does_not_store_the_unfinished_surface(self):
        turn = A2uiTurn(new_session())
        turn.start_pass()
        client = Client()
        client.apply(turn.feed('<a2ui>\nsurface("cut")\nroot = Column([a, b])\na = Text("x")\n'))
        self.assertEqual(client.surfaces(), ["cut"])  # streamed
        turn.save("run-cut")  # the connection dropped before `</a2ui>`
        self.assertEqual([p for p in turn.parts if p["type"] == "a2ui"], [])


class SeveralSurfacesTest(unittest.TestCase):
    A = '<a2ui>\nsurface("a")\nroot = Card(Text("one"))\n</a2ui>\n'
    B = '<a2ui>\nsurface("b")\nroot = Card(Text("two"))\n</a2ui>\n'
    BAD = '<a2ui>\nsurface("c")\nroot = Column([x, y])\nx = Text("ok")\ny = Nope()\n</a2ui>\n'

    def test_two_surfaces_in_one_reply_both_stream(self):
        for size in (1, 5, 11, 1000):
            turn = A2uiTurn(new_session())
            _, client = stream(turn, chunks("Two cards.\n" + self.A + "and\n" + self.B + "done", size))
            self.assertEqual(client.surfaces(), ["a", "b"], size)
            self.assertEqual(turn.rejected, [], size)
            self.assertEqual(sorted(turn.surface_ids), ["a", "b"], size)

    def test_two_blocks_in_one_chunk(self):
        turn = A2uiTurn(new_session())
        _, client = stream(turn, [self.A + self.B])
        self.assertEqual(client.surfaces(), ["a", "b"])

    def test_the_end_of_a_good_block_and_the_start_of_a_bad_one_in_one_chunk(self):
        # Chunk cut so that `</a2ui>` and the next block's first lines arrive together.
        text = self.A + self.BAD
        cut = text.index(CLOSE) + len(CLOSE)
        for shift in range(0, 40):
            turn = A2uiTurn(new_session())
            _, client = stream(turn, [text[: cut + shift], text[cut + shift :]])
            self.assertEqual(client.surfaces(), ["a"], shift)
            self.assertEqual(turn.surface_ids, ["a"], shift)
            self.assertTrue(turn.rejected, shift)

    def test_a_bad_surface_between_two_good_ones_only_loses_itself(self):
        turn = A2uiTurn(new_session())
        _, client = stream(turn, chunks(self.A + self.BAD + self.B, 4))
        self.assertEqual(client.surfaces(), ["a", "b"])
        self.assertEqual(sorted(turn.surface_ids), ["a", "b"])
        self.assertEqual(len(turn.rejected), 1)


class ExistingSurfaceTest(unittest.TestCase):
    def _turn_with_form(self):
        session = new_session()
        first = A2uiTurn(session)
        stream(first, chunks(FORM_REPLY, 9))
        first.save("run-1")
        return session

    def test_an_update_to_an_existing_surface_waits_for_its_block_to_end(self):
        update = '<a2ui>\nsurface("trip_prefs", update=true)\n$/form/days = ["3"]\ngo = Button(Text("Go"), "primary", Event("plan_trip", {}))\n</a2ui>'
        turn = A2uiTurn(self._turn_with_form())
        pieces = chunks(update, 6)
        seen, _ = stream(turn, pieces)
        end = next(i for i, _ in enumerate(pieces) if CLOSE in "".join(pieces[: i + 1]))
        first = next(i for i, ev in enumerate(seen) if any(n == "a2ui" for n, _ in ev))
        self.assertGreaterEqual(first, end)  # nothing partial: it cannot be undone on the client
        self.assertEqual(turn.rejected, [])

    def test_a_failing_update_changes_nothing(self):
        update = '<a2ui>\nsurface("trip_prefs", update=true)\n$/form/days = ["3"]\ngo = Nope()\n</a2ui>'
        turn = A2uiTurn(self._turn_with_form())
        _, client = stream(turn, chunks(update, 6))
        self.assertEqual(client.messages, [])
        self.assertTrue(turn.rejected)
        self.assertEqual(turn.surface_ids, ["trip_prefs"])

    def test_a_new_surface_in_a_later_turn_streams(self):
        turn = A2uiTurn(self._turn_with_form())
        pieces = chunks(SeveralSurfacesTest.A, 5)
        seen, client = stream(turn, pieces)
        self.assertLess(first_piece_with(seen, "createSurface"), len(pieces) - 1)
        self.assertEqual(client.surfaces(), ["a"])
        self.assertEqual(sorted(turn.surface_ids), ["a", "trip_prefs"])


if __name__ == "__main__":
    unittest.main()
