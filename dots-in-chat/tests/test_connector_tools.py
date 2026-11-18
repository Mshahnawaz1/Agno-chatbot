"""Offline tests: cache, catalog search, routing, stickiness, meta tools, skills.

Run from dots-in-chat/:
    PYTHONPATH=. python -m unittest tests.test_connector_tools -v

No network: MCP servers and the model are never called.
"""

import os
import tempfile
import unittest
from types import SimpleNamespace

_tmp = tempfile.mkdtemp()
os.environ["APP_DB_PATH"] = os.path.join(_tmp, "app.db")  # before app.config is imported

from app import db  # noqa: E402
from app.connectors import catalog, tools  # noqa: E402
from app.connectors.registry import CONNECTORS  # noqa: E402
from app.exact_cache import ExactCache  # noqa: E402

db.init_db()


def mcp_tool(name, description, read_only=False, props=None):
    """Shaped like mcp.types.Tool."""
    return SimpleNamespace(
        name=name,
        description=description,
        inputSchema={"type": "object", "properties": props or {}},
        annotations=SimpleNamespace(readOnlyHint=read_only),  # old-style field names: both are read
    )


TODOIST = [
    mcp_tool("get-overview", "Get an overview of the user's projects and tasks.", True),
    mcp_tool("find-projects", "List or search projects by name.", True),
    mcp_tool("find-tasks", "Search tasks by text, project, section or label.", True),
    mcp_tool("find-tasks-by-date", "Get tasks due on a date or in a date range, including overdue.", True),
    mcp_tool("add-tasks", "Add one or more tasks with due dates, priorities and projects.", props={"tasks": {"type": "array"}}),
    mcp_tool("reschedule-tasks", "Move tasks to a new due date or time.", False),
    mcp_tool("complete-tasks", "Mark tasks as completed.", False),
    mcp_tool("delete-object", "Delete a task or project."),  # not in include_tools: must stay hidden
]
RECLAIM = [
    mcp_tool("get_schedule", "Get the user's calendar schedule and events for a day or week.", True),
    mcp_tool("find_open_time", "Find open free time slots on the calendar.", True),
    mcp_tool("focus_stats", "Focus time statistics.", True),
    mcp_tool("create_reclaim_task", "Create a Reclaim task that is scheduled on the calendar."),
    mcp_tool("search_reclaim_tasks", "Search Reclaim tasks.", True),
]
catalog.store(CONNECTORS["todoist"], TODOIST)
catalog.store(CONNECTORS["reclaim"], RECLAIM)
SPECS = catalog.cached(CONNECTORS["todoist"])[0] + catalog.cached(CONNECTORS["reclaim"])[0]
NAMES = {s.name for s in SPECS}


def run_context(state=None, query="", user_id="u1"):
    return SimpleNamespace(user_id=user_id, run_id="run-123456789", session_state=state,
                           metadata={"query": query})


class ExactCacheTest(unittest.TestCase):
    def test_hit_expiry_and_drop(self):
        c = ExactCache(ttl=60)
        k = "u1:todoist:" + c.make_hash("t", {"b": 1, "a": 2})
        self.assertEqual(k, "u1:todoist:" + c.make_hash("t", {"a": 2, "b": 1}))  # key order irrelevant
        self.assertIsNone(c.get(k))
        c.set(k, "v")
        self.assertEqual(c.get(k), "v")
        c.set("x", "old", ttl=-1)
        self.assertIsNone(c.get("x"))  # expired
        c.drop("u1:todoist:")
        self.assertIsNone(c.get(k))

    def test_bounded(self):
        c = ExactCache(max_items=2)
        for i in range(3):
            c.set(str(i), i)
        self.assertIsNone(c.get("0"))
        self.assertEqual(c.get("2"), 2)


class CatalogTest(unittest.TestCase):
    def test_include_tools_is_an_allowlist(self):
        self.assertNotIn("todoist_delete-object", NAMES)
        self.assertIn("todoist_add-tasks", NAMES)

    def test_survives_restart(self):
        catalog._memory.clear()  # as after a restart: read back from the DB
        specs, fresh = catalog.cached(CONNECTORS["todoist"])
        self.assertTrue(fresh)
        self.assertTrue(next(s for s in specs if s.name == "todoist_get-overview").read_only)
        self.assertFalse(next(s for s in specs if s.name == "todoist_add-tasks").read_only)

    def test_search_ranks_the_right_tool_first(self):
        cases = {
            "add a task to buy milk": "todoist_add-tasks",
            "what tasks are due tomorrow": "todoist_find-tasks-by-date",
            "find free time on my calendar": "reclaim_find_open_time",
            "mark the laundry task completed": "todoist_complete-tasks",
        }
        for query, expected in cases.items():
            self.assertEqual(catalog.search(SPECS, query)[0][1].name, expected, query)

    def test_mentioned_connectors(self):
        ids = ["todoist", "reclaim"]
        self.assertEqual(catalog.mentioned_connectors("check my Reclaim.ai schedule", ids), ["reclaim"])
        self.assertEqual(catalog.mentioned_connectors("hi there", ids), [])


class RouterTest(unittest.TestCase):
    def test_greeting_attaches_nothing(self):
        for q in ["hi", "how are you", "what is the capital of india", "weather in pune"]:
            picked, _ = tools.route(q, SPECS)
            self.assertEqual(picked, [], q)

    def test_named_connector_attaches_its_tools_only(self):
        picked, why = tools.route("show my todoist", SPECS)
        self.assertTrue(picked)
        self.assertTrue(all(s.connector == "todoist" for s in picked))
        self.assertLessEqual(len(picked), tools.MAX_ROUTED)
        self.assertIn("named", why)

    def test_obvious_unnamed_request_attaches(self):
        picked, _ = tools.route("add a task to call mom at 5pm", SPECS)
        self.assertEqual(picked[0].name, "todoist_add-tasks")


class StickinessTest(unittest.TestCase):
    def test_used_tools_stay_then_detach(self):
        state = {}
        u = tools._Usage(run_context(state))
        u.next_run()
        u.mark("todoist_add-tasks")
        for _ in range(tools.STICKY_RUNS - 1):
            u = tools._Usage(run_context(state))
            u.next_run()
            self.assertEqual(u.sticky(), ["todoist_add-tasks"])
        u = tools._Usage(run_context(state))
        u.next_run()
        self.assertEqual(u.sticky(), [])  # unused for STICKY_RUNS runs: detached


class UserToolsTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.calls = []

        async def fake_call(user_id, spec, arguments):
            self.calls.append((spec.name, arguments))
            return f"ok {spec.name}"

        async def fake_specs(user_id):
            return SPECS

        self._orig = tools.call, tools.user_specs
        tools.call, tools.user_specs = fake_call, fake_specs

    async def asyncTearDown(self):
        tools.call, tools.user_specs = self._orig

    async def test_cheap_message_gets_only_meta_tools(self):
        fns = await tools.user_connector_tools(run_context({}, "hi"))
        self.assertEqual([f.name for f in fns], ["search_tools", "get_tool", "call_tool"])

    async def test_search_get_call_and_sticky_attachment(self):
        state = {}
        fns = {f.name: f for f in await tools.user_connector_tools(run_context(state, "hello"))}
        found = await fns["search_tools"].entrypoint(query="add a task")
        self.assertTrue(found.startswith("todoist_add-tasks"))
        self.assertIn("Arguments of todoist_add-tasks", found)  # clear winner: no get_tool needed
        vague = await fns["search_tools"].entrypoint(query="tasks")
        self.assertNotIn("Arguments of", vague)  # no clear winner: schema withheld
        schema = await fns["get_tool"].entrypoint(name="todoist_add-tasks")
        self.assertIn('"tasks"', schema)
        result = await fns["call_tool"].entrypoint(name="todoist_add-tasks", arguments={"tasks": []})
        self.assertEqual(result, "ok todoist_add-tasks")
        self.assertEqual(self.calls, [("todoist_add-tasks", {"tasks": []})])
        self.assertIn("No tool", await fns["call_tool"].entrypoint(name="todoist_delete-object"))

        # Next message in the same chat: the tool it used is attached natively.
        fns = {f.name: f for f in await tools.user_connector_tools(run_context(state, "thanks"))}
        self.assertIn("todoist_add-tasks", fns)
        self.assertEqual(fns["todoist_add-tasks"].parameters["properties"], {"tasks": {"type": "array"}})
        await fns["todoist_add-tasks"].entrypoint(tasks=[1], _agno_run_context=None)
        self.assertEqual(self.calls[-1], ("todoist_add-tasks", {"tasks": [1]}))  # agno args stripped

    async def test_native_attachment_is_capped(self):
        state = {"connector_tools": {"run": 5, "used": {n: 5 for n in NAMES}}}
        fns = await tools.user_connector_tools(run_context(state, "show my todoist tasks"))
        self.assertLessEqual(len(fns) - 3, tools.MAX_NATIVE)


class SkillsTest(unittest.IsolatedAsyncioTestCase):
    async def test_snippet_tools_search_and_allowed_tools(self):
        from app.agent.skills import skills

        # ~tokens; the index names each skill's files so the model loads them in its first call.
        self.assertLess(len(skills.get_system_prompt_snippet()) // 4, 420)
        # Few skills: the index lists them all, so no search_skills round trip (see skills.INLINE_MAX).
        self.assertEqual([f.name for f in skills.get_tools()], ["get_skill_instructions"])
        self.assertTrue(skills.search_skills("schedule focus time on my calendar").startswith("reclaim"))

        async def fake_specs(user_id):
            return SPECS

        orig, tools.user_specs = tools.user_specs, fake_specs
        try:
            state = {}
            rc = run_context(state)
            tools._Usage(rc).next_run()
            text = await skills.get_skill_instructions("todoist", rc, paths=[])
        finally:
            tools.user_specs = orig
        self.assertIn("# Todoist", text)
        self.assertIn('"name":"todoist_add-tasks"', text)  # schema handed over for call_tool
        self.assertIn("todoist_add-tasks", state["connector_tools"]["used"])  # attached from next run
        self.assertIn("No skill", await skills.get_skill_instructions("nope", rc, paths=[]))



class ModelSafeSchemaTest(unittest.TestCase):
    def test_null_is_dropped_from_enums_only(self):
        schema = {
            "type": "object",
            "properties": {
                "view": {"type": ["string", "null"], "enum": ["skeleton", "fields", "full", None]},
                "nested": {"items": [{"enum": [None, "a"]}]},
                "keep": {"type": "string", "default": None},
            },
        }
        out = tools.model_safe_schema(schema)
        self.assertEqual(out["properties"]["view"]["enum"], ["skeleton", "fields", "full"])
        self.assertEqual(out["properties"]["view"]["type"], ["string", "null"])
        self.assertEqual(out["properties"]["nested"]["items"][0]["enum"], ["a"])
        self.assertIsNone(out["properties"]["keep"]["default"])
        self.assertIn(None, schema["properties"]["view"]["enum"])  # input left as it was

if __name__ == "__main__":
    unittest.main()
