"""Scenario tests for A2UI function RPC, both directions (run from dots-in-chat/):

    PYTHONPATH=. python -m unittest tests.test_a2ui_rpc -v

The model is scripted; the "browser" is a coroutine that answers the way web_core's RpcHandler
does. The route, the SDK's call table and processors, and the tool are the real ones.
"""

import asyncio
import json
import unittest
from agno.run import RunContext

from app.a2ui import rpc
from app.a2ui.catalog import CATALOG_ID
from tests.a2ui_http import Harness, a2ui_kinds, sse_events


def response(call_id, **kw):
    return {"version": "1.0", "rendererFunctionResponse": {"functionCallId": call_id, **kw}}


def agent_call(name, args=None, call_id="f1", surface="s1"):
    return {"version": "1.0", "callAgentFunction": {
        "surfaceId": surface, "functionCallId": call_id,
        "callFunction": {"@call": name, "catalogId": CATALOG_ID, "args": args or {}},
    }}


class Scenario:
    """One chat whose model calls call_renderer_function, with a scripted browser."""

    def __init__(self, h: Harness, browser=None):
        self.h = h
        self.session = h.new_session()
        self.tool_results: list[str] = []
        self.browser = browser  # async (call_message, client) -> response message or None

    def model(self, *calls):
        async def reply(kw):
            ctx = RunContext(run_id="r", session_id=kw["session_id"])
            for name, args in calls:
                self.tool_results.append(await rpc.call_renderer_function.entrypoint(ctx, name, json.dumps(args)))
            return "Done: " + " | ".join(self.tool_results)

        self.h.agent.replies = [reply]

    async def watch_browser(self, client):
        """Answers calls the way the browser would: polls the call table, replies on /chat/rpc."""
        answered = set()
        while True:
            await asyncio.sleep(0.01)
            chat = rpc._chats.get(self.session)
            for call_id in list(chat.calls._pending if chat else []):
                if call_id in answered or self.browser is None:
                    continue
                answered.add(call_id)
                msg = await self.browser(call_id)
                if msg is not None:
                    await client.post("/chat/rpc", json={"session_id": self.session, "message": msg})

    async def run(self, text="where am I?"):
        async with self.h.async_client() as client:
            watcher = asyncio.create_task(self.watch_browser(client))
            try:
                res = await client.post("/chat/stream", json={"message": text, "session_id": self.session})
            finally:
                watcher.cancel()
        self.assertion_status = res.status_code
        return sse_events(res.text)


class AgentCallsRendererTest(unittest.TestCase):
    def setUp(self):
        self.h = Harness()

    def tearDown(self):
        self.h.close()

    def run_scenario(self, browser, *calls, timeout=None):
        sc = Scenario(self.h, browser)
        sc.model(*calls)
        events = asyncio.run(sc.run())
        return sc, events

    def test_the_model_gets_the_browsers_value_and_the_call_reaches_the_stream(self):
        async def browser(call_id):
            return response(call_id, value={"timezone": "Asia/Kolkata", "locale": "en-IN"})

        sc, events = self.run_scenario(browser, ("clientInfo", {}))
        self.assertEqual(json.loads(sc.tool_results[0]), {"value": {"timezone": "Asia/Kolkata", "locale": "en-IN"}})
        calls = [d["message"] for n, d in events if n == "a2ui_rpc"]
        self.assertEqual(len(calls), 1)
        fn = calls[0]["callRendererFunction"]
        self.assertEqual(fn["callFunction"], {"@call": "clientInfo", "catalogId": CATALOG_ID, "args": {}})
        self.assertTrue(fn["functionCallId"])
        self.assertNotIn("callRendererFunction", a2ui_kinds(events), "the call is not a surface message: it is never stored")
        self.assertEqual(events[-1][0], "done")

    def test_a_renderer_error_comes_back_to_the_model_as_an_error(self):
        async def browser(call_id):
            return response(call_id, error={"code": "EXECUTION_ERROR", "message": "no screen"})

        sc, _ = self.run_scenario(browser, ("clientInfo", {}))
        self.assertEqual(json.loads(sc.tool_results[0])["error"]["code"], "EXECUTION_ERROR")

    def test_a_browser_that_never_answers_times_out(self):
        from unittest import mock

        with mock.patch.object(rpc, "CALL_TIMEOUT", 0.2):
            sc, events = self.run_scenario(None, ("clientInfo", {}))
        self.assertEqual(json.loads(sc.tool_results[0])["error"]["code"], "TIMEOUT")
        self.assertEqual(events[-1][0], "done")

    def test_the_catalog_decides_what_the_agent_may_call(self):
        # formatDate: rendererOnly. openUrl: needs user activation. serverTime: an agent function.
        # nope: not in the catalog. None of them may reach the browser.
        sc, events = self.run_scenario(None, ("formatDate", {}), ("openUrl", {"url": "https://x.io"}), ("serverTime", {}), ("nope", {}))
        errors = [json.loads(r)["error"]["code"] for r in sc.tool_results]
        self.assertEqual(errors, ["INVALID_FUNCTION_CALL", "INVALID_FUNCTION_CALL", "UNKNOWN_FUNCTION", "UNKNOWN_FUNCTION"])
        self.assertEqual([n for n, _ in events if n == "a2ui_rpc"], [])

    def test_bad_arguments_json_is_refused_before_anything_is_sent(self):
        sc = Scenario(self.h)
        ctx = RunContext(run_id="r", session_id=sc.session)
        for bad in ("not json", "[1]"):
            out = asyncio.run(rpc.call_renderer_function.entrypoint(ctx, "clientInfo", bad))
            self.assertEqual(json.loads(out)["error"]["code"], "INVALID_FUNCTION_CALL")

    def test_without_an_open_stream_there_is_no_browser(self):
        ctx = RunContext(run_id="r", session_id="no-such-chat")
        out = asyncio.run(rpc.call_renderer_function.entrypoint(ctx, "clientInfo", "{}"))
        self.assertEqual(json.loads(out)["error"]["code"], "NO_RENDERER")

    def test_a_stream_that_ends_cancels_calls_still_waiting(self):
        async def go():
            outbox = asyncio.Queue()
            rpc.open_stream("c1", outbox)
            task = asyncio.create_task(rpc.call_renderer("c1", "clientInfo"))
            await asyncio.sleep(0.01)
            rpc.close_stream("c1")
            with self.assertRaises(Exception) as cm:
                await task
            return cm.exception

        err = asyncio.run(go())
        self.assertEqual(err.code, "CANCELLED")


class RendererCallsAgentTest(unittest.TestCase):
    def setUp(self):
        self.h = Harness()
        self.session = self.h.new_session()

    def tearDown(self):
        self.h.close()

    def rpc(self, message, status=200, session=None):
        res = self.h.client.post("/chat/rpc", json={"session_id": session or self.session, "message": message})
        self.assertEqual(res.status_code, status, res.text)
        return res.json()

    def test_an_agent_function_is_answered_with_one_agent_function_response(self):
        out = self.rpc(agent_call("serverTime", {"timezone": "Asia/Kolkata"}))
        self.assertTrue(out["handled"])
        (reply,) = out["replies"]
        self.assertEqual(reply["agentFunctionResponse"]["functionCallId"], "f1")
        self.assertTrue(reply["agentFunctionResponse"]["value"].endswith("+05:30"))

    def test_the_default_argument_is_applied(self):
        (reply,) = self.rpc(agent_call("serverTime"))["replies"]
        self.assertTrue(reply["agentFunctionResponse"]["value"].endswith("+00:00"))

    def test_unknown_function_invalid_arguments_and_handler_errors_are_errors_not_crashes(self):
        cases = [
            (agent_call("nope"), "UNKNOWN_FUNCTION"),
            (agent_call("serverTime", {"timezone": 5}), "INVALID_FUNCTION_CALL"),
            (agent_call("serverTime", {"extra": 1}), "INVALID_FUNCTION_CALL"),
            (agent_call("serverTime", {"timezone": "Mars/Base"}), "INVALID_FUNCTION_CALL"),
        ]
        for message, code in cases:
            (reply,) = self.rpc(message)["replies"]
            self.assertEqual(reply["agentFunctionResponse"]["error"]["code"], code, message)
            self.assertEqual(reply["agentFunctionResponse"]["functionCallId"], "f1")

    def test_a_catalog_the_agent_does_not_have_is_unknown(self):
        message = agent_call("serverTime")
        message["callAgentFunction"]["callFunction"]["catalogId"] = "other/catalog"
        (reply,) = self.rpc(message)["replies"]
        self.assertEqual(reply["agentFunctionResponse"]["error"]["code"], "UNKNOWN_FUNCTION")

    def test_a_call_without_an_id_cannot_be_answered(self):
        message = agent_call("serverTime")
        del message["callAgentFunction"]["functionCallId"]
        self.rpc(message, status=400)
        self.rpc({"version": "1.0", "nonsense": {}}, status=400)
        self.rpc({"callAgentFunction": {}}, status=400)

    def test_another_users_chat_is_a_404(self):
        self.rpc(agent_call("serverTime"), status=404, session="not-mine")

    def test_a_response_nobody_waits_for_is_not_handled(self):
        out = self.rpc(response("ghost", value=1))
        self.assertEqual(out, {"handled": False, "replies": []})


STANDALONE = """Checking your device.
<a2ui>
clientInfo()
</a2ui>"""


class StandaloneCallTest(unittest.TestCase):
    """The model writes `clientInfo()` itself (the SDK's own path): there is no tool to wait on, so
    the browser's response comes back as its own turn."""

    def setUp(self):
        self.h = Harness()
        self.session = self.h.new_session()

    def tearDown(self):
        self.h.close()

    def test_a_standalone_call_compiles_to_a_call_renderer_function_message(self):
        self.h.agent.replies = [STANDALONE]
        events = self.h.post({"message": "what device?", "session_id": self.session})
        msgs = [d["message"] for n, d in events if n == "a2ui" and "callRendererFunction" in d["message"]]
        self.assertEqual(len(msgs), 1)
        self.assertEqual(msgs[0]["callRendererFunction"]["callFunction"]["@call"], "clientInfo")

    def test_its_response_becomes_a_hidden_turn_the_model_answers(self):
        self.h.agent.replies = ["You are in Kolkata."]
        events = self.h.post({
            "function_response": response("call-1", value={"timezone": "Asia/Kolkata"}),
            "session_id": self.session,
        })
        self.assertIn("Asia/Kolkata", self.h.agent.inputs[0])
        self.assertTrue(self.h.agent.kwargs[0]["metadata"]["a2ui_hidden_input"])
        self.assertEqual(events[-1][0], "done")

    def test_a_malformed_function_response_is_a_400(self):
        self.h.post({"function_response": {"version": "1.0"}, "session_id": self.session}, status=400)
        self.h.post({"function_response": response("c")}, status=400)  # no chat yet
        self.assertEqual(self.h.agent.inputs, [])


class SkillCheckTest(unittest.TestCase):
    """The check script of the RPC part of the a2ui skill: what the agent is told it can call is
    exactly what the catalog lets it call."""

    def test_rpc_guide_lists_exactly_the_functions_an_agent_may_call(self):
        import re

        from app.a2ui.catalog import CATALOG
        from app.a2ui.functions import AGENT_CALLABLE
        from app.a2ui.skill_build import SKILL_DIR

        callable_in_catalog = sorted(
            name for name, fn in CATALOG.renderer_functions.items()
            if fn.allowed_callers in ("agentOnly", "rendererOrAgent") and not fn.requires_user_activation
        )
        self.assertEqual(sorted(AGENT_CALLABLE), callable_in_catalog)
        guide = (SKILL_DIR / "references" / "rpc.md").read_text()
        listed = sorted(re.findall(r"^\| `(\w+)` \|", guide, re.MULTILINE))
        self.assertEqual(listed, callable_in_catalog)
        self.assertIn("call_renderer_function", guide)
        self.assertIn("references/rpc.md", (SKILL_DIR / "SKILL.md").read_text())

    def test_the_frontend_implements_the_renderer_functions_the_server_declares(self):
        import re
        from pathlib import Path

        from app.a2ui.catalog import CATALOG

        ts = (Path(__file__).parents[1] / "frontend/src/features/chat/a2ui/catalog/functions.ts").read_text()
        for name in ("clientInfo",):
            fn = CATALOG.renderer_functions[name]
            self.assertIn(f"name: '{name}'", ts)
            self.assertIn(f"allowedCallers: '{fn.allowed_callers}'", ts)
            self.assertEqual(fn.requires_user_activation, "requiresUserActivation: true" in ts)

    def test_the_tool_is_registered_for_every_run(self):
        from app.agent.toolset import BASE_TOOLS

        self.assertIn(rpc.call_renderer_function, BASE_TOOLS)

    def test_the_tool_does_not_expose_the_run_context_to_the_model(self):
        rpc.call_renderer_function.process_entrypoint()
        self.assertEqual(sorted(rpc.call_renderer_function.parameters["properties"]), ["args_json", "function"])


if __name__ == "__main__":
    unittest.main()
