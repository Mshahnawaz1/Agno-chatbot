"""Scenario tests for the renderer-to-agent feedback channel (run from dots-in-chat/):

    PYTHONPATH=. python -m unittest tests.test_a2ui_feedback -v

Each scenario drives the real /chat/stream route with a scripted model (tests/a2ui_http.py).
"""

import unittest

from tests.a2ui_http import Harness, a2ui_kinds

FORM = """Here is the form.
<a2ui>
surface("trip")
$/form/name = ""
root = Card(Column([title, nameField]))
title = Text("### Trip")
nameField = TextField("Your name", $/form/name)
</a2ui>"""

FIXED = """Fixed.
<a2ui>
surface("trip", update=true)
nameField = TextField("Your name", $/form/name)
</a2ui>"""


def error(code="VALIDATION_FAILED", **kw):
    body = {"code": code, "message": "bad", **kw}
    return {"version": "1.0", "error": body}


class RendererErrorTest(unittest.TestCase):
    def setUp(self):
        self.h = Harness()
        self.session = self.h.new_session()
        self.h.agent.replies = [FORM]
        self.h.post({"message": "plan a trip", "session_id": self.session})
        self.h.agent.inputs.clear(), self.h.agent.kwargs.clear()

    def tearDown(self):
        self.h.close()

    def test_validation_failed_reaches_the_model_and_the_reply_updates_the_surface(self):
        self.h.agent.replies = [FIXED]
        err = error(surfaceId="trip", path="/components/2/text", message="Text must be a string")
        events = self.h.post({"errors": [err], "session_id": self.session})
        asked = self.h.agent.inputs[0]
        self.assertIn("Renderer error", asked)
        self.assertIn("/components/2/text", asked)
        self.assertIn("Surfaces that exist now: trip", asked)
        self.assertIn("updateComponents", a2ui_kinds(events))
        self.assertEqual(events[-1][0], "done")
        meta = self.h.agent.kwargs[0]["metadata"]
        self.assertTrue(meta["a2ui_renderer_error"])  # history hides this input
        self.assertEqual(meta["query"], "")  # the tool router gets nothing to match

    def test_generic_expression_error_is_accepted(self):
        self.h.agent.replies = ["Looks like the budget formula failed; I can't fix it from here."]
        err = error("EXPRESSION_ERROR", surfaceId="trip", functionCallId="f1", message="division by zero")
        events = self.h.post({"errors": [err], "session_id": self.session})
        self.assertIn("EXPRESSION_ERROR", self.h.agent.inputs[0])
        self.assertEqual(a2ui_kinds(events), [])
        self.assertEqual(events[-1][0], "done")

    def test_several_errors_in_one_request(self):
        self.h.agent.replies = [FIXED]
        errs = [error(surfaceId="trip", path="/a"), error("UNALLOWED_CHILD", surfaceId="trip", path="/b")]
        self.h.post({"errors": errs, "session_id": self.session})
        self.assertIn('"/a"', self.h.agent.inputs[0])
        self.assertIn('"/b"', self.h.agent.inputs[0])

    def test_malformed_error_is_a_400_and_never_reaches_the_model(self):
        for bad in ({"version": "1.0", "oops": {}}, {"error": {"code": "X", "message": "m"}},
                    {"version": "1.0", "error": {"code": "X"}}):
            body = self.h.post({"errors": [bad], "session_id": self.session}, status=400)
            self.assertIn("Invalid error", body["detail"])
        self.assertEqual(self.h.agent.inputs, [])

    def test_too_many_errors_are_refused(self):
        self.h.post({"errors": [error()] * 6, "session_id": self.session}, status=422)

    def test_errors_need_an_existing_chat(self):
        self.h.post({"errors": [error()]}, status=400)

    def test_a_message_and_errors_together_are_refused(self):
        self.h.post({"message": "hi", "errors": [error()], "session_id": self.session}, status=422)

    def test_a_still_broken_correction_gets_the_normal_repair_rounds(self):
        bad = '<a2ui>\nsurface("trip", update=true)\nnameField = Nope("x")\n</a2ui>'
        self.h.agent.replies = [bad, bad, bad]
        events = self.h.post({"errors": [error(surfaceId="trip")], "session_id": self.session})
        self.assertEqual(len(self.h.agent.inputs), 3)  # the reply + 2 repairs
        self.assertEqual(sum(n == "a2ui_repair" for n, _ in events), 2)
        self.assertTrue(self.h.agent.kwargs[1]["metadata"]["a2ui_repair"])


if __name__ == "__main__":
    unittest.main()
