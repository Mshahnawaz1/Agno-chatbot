"""Phase 12.A audit, server side: the "Unknown" rows run against the app's compiler and catalog.

Run from dots-in-chat/:
    PYTHONPATH=. python -m unittest tests.test_a2ui_audit -v

Verdicts (2026-11-17, a2ui-agent-sdk 0.11.0, chat catalog dots-in-chat/chat/v1):
  inline createSurface components/data  DONE     the compiler itself emits them
  progressive render (server)           PARTIAL  compiled per statement, but A2uiTurn holds a block's messages until </a2ui>
  @checks                               PARTIAL  `checks` (SDK spelling) compiles; the spec's `@checks` is rejected
  ValidationResult conditions           DONE     `?required/?email/?length(...)` compile to validation calls
  @accessibility / accessibility        PARTIAL  JSON `accessibility` validates; Express has no argument for it (the model's only path); spec's `@accessibility` rejected
  templates (_template)                 DONE
  @index                                DONE     `@index()` / `@index(1)` compile (direct call); renderer side: e2e/audit.mjs

Tests marked expectedFailure are the missing/partial behaviours: when one is fixed it flips to
"unexpected success" and the verdict here must be updated. The renderer side is frontend/e2e/audit.mjs;
Express -> renderer end to end is frontend/e2e/pipeline.mjs.
"""

import os
import unittest

os.environ.setdefault("JWT_SECRET", "test-only")
os.environ.setdefault("CONNECTOR_SECRET", "test-only")

from app.a2ui.catalog import BASIC_ID, new_processor  # noqa: E402
from app.a2ui.turn import A2uiTurn  # noqa: E402
from tests.test_a2ui import new_session, run_reply  # noqa: E402


def compile_reply(reply: str, chunk: int = 7):
    events = run_reply(A2uiTurn(new_session()), reply, chunk)
    messages = [d["message"] for n, d in events if n == "a2ui"]
    errors = [d for n, d in events if n == "a2ui_error"]
    return messages, errors


def components_of(messages):
    out = {}
    for m in messages:
        for key in ("createSurface", "updateComponents"):
            for c in m.get(key, {}).get("components", []):
                out[c["id"]] = c
    return out


class InlineSurfaceTest(unittest.TestCase):
    """createSurface may carry components and dataModel inline (v1.0)."""

    def test_validator_accepts_inline_components_and_data(self):
        state = new_processor().create_state()
        state.apply([{
            "version": "1.0",
            "createSurface": {
                "surfaceId": "s",
                "components": [{"id": "root", "component": "Text", "catalogId": BASIC_ID, "text": {"@path": "/x"}}],
                "dataModel": {"x": "hi"},
            },
        }])
        self.assertEqual(list(state.surface_ids), ["s"])

    def test_the_compiler_emits_them_inline(self):
        messages, errors = compile_reply('<a2ui>\nsurface("s")\n$/x = "hi"\nroot = Text($/x)\n</a2ui>')
        self.assertEqual(errors, [])
        create = messages[0]["createSurface"]
        self.assertEqual(create["dataModel"], {"x": "hi"})
        self.assertEqual(create["components"][0]["id"], "root")


class ProgressiveTest(unittest.TestCase):
    REPLY = (
        '<a2ui>\nsurface("p")\nroot = Column([a, b, c])\n'
        'a = Text("first")\nb = Text("second")\nc = Text("third")\n</a2ui>\ntail text'
    )

    def test_events_arrive_before_the_block_ends(self):
        """Progressive streaming (12.D): the first a2ui event leaves while the block is still being written."""
        turn = A2uiTurn(new_session())
        turn.start_pass()
        first_a2ui_at = None
        for i, ch in enumerate(self.REPLY):
            events = turn.feed(ch)
            if first_a2ui_at is None and any(n == "a2ui" for n, _ in events):
                first_a2ui_at = i
        turn.close()
        self.assertIsNotNone(first_a2ui_at)
        self.assertLess(first_a2ui_at, self.REPLY.index("</a2ui>"))

    def test_first_components_are_sent_before_the_block_ends(self):
        turn = A2uiTurn(new_session())
        turn.start_pass()
        first_a2ui_at = None
        for i, ch in enumerate(self.REPLY):
            if first_a2ui_at is None and any(n == "a2ui" for n, _ in turn.feed(ch)):
                first_a2ui_at = i
        self.assertLess(first_a2ui_at, self.REPLY.index("</a2ui>"))

    def test_the_compiler_itself_is_incremental(self):
        """The SDK stream yields a message per finished statement, so 12.D only has to stop holding them."""
        processor = new_processor()
        stream = processor.open_stream(state=processor.create_state(), after_rejected_block="continue")
        seen = []
        for ch in self.REPLY[: self.REPLY.index("</a2ui>")]:
            for part in stream.feed(ch):
                seen.append(part)
        self.assertGreater(len(seen), 5)  # createSurface, then a message per statement (even per token of a string)
        self.assertTrue(all(len(p.a2ui) == 1 for p in seen))


class ChecksTest(unittest.TestCase):
    EXPRESS = (
        '<a2ui>\nsurface("c")\n$/e = ""\nroot = Column([f, go])\n'
        'f = TextField("Email", $/e, checks=[?required("Email is required"), ?email("Not an email")])\n'
        'go = Button(Text("Send"), "primary", Event("send"), checks=[?email($/e, "Fix the email")])\n</a2ui>'
    )

    def test_express_checks_compile_to_validation_calls(self):
        messages, errors = compile_reply(self.EXPRESS)
        self.assertEqual(errors, [])
        comps = components_of(messages)
        calls = [c["condition"]["@call"] for c in comps["f"]["checks"]]
        self.assertEqual(calls, ["required", "email"])
        self.assertEqual(comps["f"]["checks"][1]["message"], "Not an email")
        self.assertEqual(comps["go"]["checks"][0]["condition"]["@call"], "email")

    def test_a_button_check_needs_its_value_spelled_out(self):
        """On a field the value binds to the field; on a Button `?email("msg")` takes the message as the value."""
        messages, _ = compile_reply('<a2ui>\nsurface("c3")\n$/e = ""\nroot = Button(Text("Go"), "primary", Event("go"), checks=[?email("Fix it")])\n</a2ui>')
        self.assertEqual(components_of(messages)["root"]["checks"][0]["condition"]["args"], {"value": "Fix it"})

    def test_length_and_regex_checks_compile(self):
        messages, errors = compile_reply(
            '<a2ui>\nsurface("c2")\n$/c = ""\nroot = TextField("Code", $/c, checks=[?length(3, 20, "At least 3"), ?regex("^[A-Z]+$", "Capitals only")])\n</a2ui>'
        )
        self.assertEqual(errors, [])
        self.assertEqual([c["condition"]["@call"] for c in components_of(messages)["root"]["checks"]], ["length", "regex"])

    @unittest.expectedFailure
    def test_spec_spelling_at_checks_is_accepted(self):
        state = new_processor().create_state()
        state.apply([
            {"version": "1.0", "createSurface": {"surfaceId": "s"}},
            {"version": "1.0", "updateComponents": {"surfaceId": "s", "components": [
                {"id": "root", "component": "TextField", "catalogId": BASIC_ID, "label": "E", "value": {"@path": "/e"},
                 "@checks": [{"condition": {"@call": "required", "args": {"value": {"@path": "/e"}}}, "message": "m"}]},
            ]}},
        ])


class AccessibilityTest(unittest.TestCase):
    def test_express_has_no_accessibility_argument(self):
        _, errors = compile_reply('<a2ui>\nsurface("a")\nroot = Button(Text("x"), "primary", Event("go"), accessibility={label: "Go now"})\n</a2ui>')
        self.assertTrue(errors)
        self.assertIn("accessibility", str(errors[0]))

    def test_json_accessibility_is_accepted_by_the_state_validator(self):
        """The wire format takes `accessibility`; only the Express compiler's Button signature omits it."""
        state = new_processor().create_state()
        state.apply([
            {"version": "1.0", "createSurface": {"surfaceId": "s", "components": [
                {"id": "t", "component": "Text", "catalogId": BASIC_ID, "text": "Go"},
                {"id": "root", "component": "Button", "catalogId": BASIC_ID, "child": "t", "action": {"event": {"name": "go"}},
                 "accessibility": {"label": "Go now"}},
            ]}},
        ])


class TemplateTest(unittest.TestCase):
    def test_template_list_compiles_with_relative_paths(self):
        messages, errors = compile_reply(
            '<a2ui>\nsurface("t")\n$/people = [{n: "Ann"}, {n: "Bob"}]\nroot = List(_template($/people, row))\nrow = Text($n)\n</a2ui>'
        )
        self.assertEqual(errors, [])
        comps = components_of(messages)
        self.assertEqual(comps["root"]["children"], {"path": "/people", "componentId": "row"})
        self.assertEqual(comps["row"]["text"], {"@path": "n"})

    def test_index_compiles_with_and_without_offset(self):
        for expr, args in (("@index()", None), ("@index(1)", {"offset": 1})):
            with self.subTest(expr=expr):
                messages, errors = compile_reply(
                    f'<a2ui>\nsurface("i")\n$/p = [{{n: "A"}}]\nroot = List(_template($/p, row))\nrow = Text({expr})\n</a2ui>'
                )
                self.assertEqual(errors, [])
                call = components_of(messages)["row"]["text"]
                self.assertEqual(call["@call"], "@index")
                self.assertEqual(call.get("args"), args)


if __name__ == "__main__":
    unittest.main()
