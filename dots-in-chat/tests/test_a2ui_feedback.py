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


FORM_SENDING = """Fill this in.
<a2ui>
surface("form", sendDataModel=true)
$/name = ""
root = Card(Column([title, nameField]))
title = Text("### Details")
nameField = TextField("Your name", $/name)
</a2ui>"""

FORM_PLAIN = FORM_SENDING.replace('surface("form", sendDataModel=true)', 'surface("plain")')


def data_model(**surfaces):
    return {"version": "1.0", "surfaces": surfaces}


class SendDataModelTest(unittest.TestCase):
    def setUp(self):
        self.h = Harness()
        self.session = self.h.new_session()

    def tearDown(self):
        self.h.close()

    def show(self, reply):
        self.h.agent.replies = [reply]
        events = self.h.post({"message": "start", "session_id": self.session})
        self.h.agent.inputs.clear(), self.h.agent.kwargs.clear()
        return events

    def test_the_surface_opts_in_with_senddatamodel_in_create_surface(self):
        events = self.show(FORM_SENDING)
        create = next(d["message"]["createSurface"] for n, d in events if n == "a2ui" and "createSurface" in d["message"])
        self.assertIs(create["sendDataModel"], True)

    def test_the_users_values_reach_the_model_for_that_turn_only(self):
        self.show(FORM_SENDING)
        self.h.agent.replies = ["Hello Asha."]
        self.h.post({
            "message": "what is my name?", "session_id": self.session,
            "a2uiRendererDataModel": data_model(form={"name": "Asha"}),
        })
        kw = self.h.agent.kwargs[0]
        self.assertTrue(kw["add_dependencies_to_context"])
        self.assertEqual(kw["dependencies"]["a2ui_surface_data_models"]["surfaces"], {"form": {"name": "Asha"}})
        self.assertEqual(self.h.agent.inputs[0], "what is my name?", "the stored input is not polluted")
        self.h.agent.replies = ["ok"]
        self.h.post({"message": "and now?", "session_id": self.session})
        self.assertNotIn("dependencies", self.h.agent.kwargs[1])

    def test_a_click_carries_the_data_model_too(self):
        self.show(FORM_SENDING)
        action = {"version": "1.0", "action": {
            "name": "go", "surfaceId": "form", "sourceComponentId": "nameField",
            "timestamp": "2026-11-17T10:00:00Z", "context": {},
        }}
        self.h.agent.replies = ["done"]
        self.h.post({"action": action, "session_id": self.session, "a2uiRendererDataModel": data_model(form={"name": "Ravi"})})
        self.assertIn("Ravi", str(self.h.agent.kwargs[0]["dependencies"]))

    def test_a_surface_that_did_not_opt_in_is_dropped(self):
        self.show(FORM_PLAIN)
        self.h.agent.replies = ["ok"]
        self.h.post({"message": "hi", "session_id": self.session, "a2uiRendererDataModel": data_model(plain={"name": "secret"})})
        self.assertNotIn("dependencies", self.h.agent.kwargs[0])

    def test_a_surface_the_chat_never_had_is_dropped(self):
        self.show(FORM_SENDING)
        self.h.agent.replies = ["ok"]
        self.h.post({
            "message": "hi", "session_id": self.session,
            "a2uiRendererDataModel": data_model(form={"name": "A"}, ghost={"leak": 1}),
        })
        shown = self.h.agent.kwargs[0]["dependencies"]["a2ui_surface_data_models"]["surfaces"]
        self.assertEqual(list(shown), ["form"])

    def test_a_malformed_data_model_is_a_400_and_the_model_is_not_called(self):
        for bad in ({"version": "1.0"}, {"version": "0.9", "surfaces": {}}, {"version": "1.0", "surfaces": {"a": 5}}):
            body = self.h.post({"message": "hi", "session_id": self.session, "a2uiRendererDataModel": bad}, status=400)
            self.assertIn("a2uiRendererDataModel", body["detail"])
        self.assertEqual(self.h.agent.inputs, [])

    def test_an_oversized_data_model_is_refused(self):
        self.show(FORM_SENDING)
        big = data_model(form={"name": "x" * 70_000})
        body = self.h.post({"message": "hi", "session_id": self.session, "a2uiRendererDataModel": big}, status=400)
        self.assertIn("larger", body["detail"])


def caps(*ids, **extra):
    return {"1.0": {"supportedCatalogIds": list(ids), **extra}}


class CapabilitiesTest(unittest.TestCase):
    def setUp(self):
        from unittest import mock
        from app.a2ui import catalog

        self.h = Harness()
        self.catalog = catalog
        self.created = []
        real = catalog.GENERATOR.create_processor

        def spy(capabilities, *a, **k):
            self.created.append(capabilities)
            return real(capabilities, *a, **k)

        patcher = mock.patch.object(catalog.GENERATOR, "create_processor", spy)
        patcher.start()
        self.addCleanup(patcher.stop)

    def tearDown(self):
        self.h.close()

    def test_the_processor_is_negotiated_with_what_the_client_sent(self):
        sent = caps("some/other/catalog", self.catalog.CATALOG_ID)
        self.h.agent.replies = ["Hi."]
        events = self.h.post({"message": "hi", "a2uiRendererCapabilities": sent})
        self.assertEqual(events[-1][0], "done")
        self.assertIn(sent, self.created)
        self.assertNotIn(self.catalog.CAPABILITIES, self.created, "the constant is not used when the client sent its own")

    def test_a_request_without_capabilities_falls_back_to_the_default_catalog(self):
        self.h.agent.replies = ["Hi."]
        self.h.post({"message": "hi"})
        self.assertIn(self.catalog.CAPABILITIES, self.created)

    def test_a_renderer_that_does_not_know_our_catalog_is_refused_before_anything_runs(self):
        body = self.h.post({"message": "hi", "a2uiRendererCapabilities": caps("some/other/catalog")}, status=400)
        self.assertIn("a2uiRendererCapabilities", body["detail"])
        self.assertEqual(self.h.agent.inputs, [])

    def test_empty_or_malformed_capabilities_are_refused(self):
        for bad in (caps(), {}, {"1.0": {}}, {"1.0": {"supportedCatalogIds": "x"}}, {"0.9": {"supportedCatalogIds": ["a"]}}):
            self.h.post({"message": "hi", "a2uiRendererCapabilities": bad}, status=400)
        self.assertEqual(self.h.agent.inputs, [])

    def test_a_malformed_inline_catalog_is_refused(self):
        bad = caps(self.catalog.CATALOG_ID, inlineCatalogs=[{"oops": 1}])
        self.h.post({"message": "hi", "a2uiRendererCapabilities": bad}, status=400)

    def test_the_frontend_catalog_id_is_the_one_the_server_serves(self):
        import re
        from pathlib import Path

        ts = (Path(__file__).parents[1] / "frontend/src/features/chat/a2ui/catalog/index.ts").read_text()
        self.assertEqual(re.search(r"CATALOG_ID = '([^']+)'", ts).group(1), self.catalog.CATALOG_ID)

    def test_a_refused_handshake_does_not_create_a_chat(self):
        from app import db

        before = len(db.list_chat_sessions(self.h.user["id"]))
        self.h.post({"message": "hi", "a2uiRendererCapabilities": caps("nope")}, status=400)
        self.assertEqual(len(db.list_chat_sessions(self.h.user["id"])), before)


if __name__ == "__main__":
    unittest.main()
