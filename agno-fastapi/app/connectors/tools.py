"""Connector tools for one run: lazy, cached, attached only when needed.

Every message would otherwise carry every connector's full tool schemas
(~2.5-3k tokens per connector) and wait for each MCP server to be pinged and
re-listed. Instead each run gets:

1. Meta tools (always, ~250 tokens) that reach every tool of every connector
   the user has switched on:
     search_tools(query)          -> matching tool names + one-liners
     get_tool(name)               -> that tool's argument schema
     call_tool(name, arguments)   -> run it now
2. Real, typed tools attached directly ("native") when that's clearly useful:
   - routed: the message names a connector, or strongly matches a tool;
   - sticky: tools this chat used, looked up or had a skill load in its last
     STICKY_RUNS runs. Unused ones detach again.

The tool list comes from the catalog (DB-cached), so a run that calls no
connector tool makes no MCP request. A connection is opened on the first call
and then kept per (user, connector). Results of read-only tools are cached
briefly; any write through the same connector clears them.
"""

import asyncio
import json
import logging
import time

from agno.tools.function import Function
from agno.tools.mcp import MCPTools

from app import db
from app.connectors import auth, catalog
from app.connectors.catalog import ToolSpec
from app.connectors.registry import CONNECTORS, Connector
from app.exact_cache import ExactCache

logger = logging.getLogger(__name__)

MAX_ROUTED = 4  # tools the router may attach for one message
MAX_NATIVE = 6  # routed + sticky, at most
OBVIOUS_SCORE = 3.0  # BM25 score above which an unnamed tool is an obvious match (tuned on real catalogs)
NAMED_MIN_SCORE = 1.5  # when the app is named, a tool matching at least this is picked first
NAMED_FILL = 3  # ...and the app's core tools fill up to this many
CLEAR_WINNER = 1.5  # search_tools includes the top hit's schema if it beats the 2nd by this factor
STICKY_RUNS = 3  # a used tool stays attached for this many runs of the chat
MAX_RESULT_CHARS = 6000  # longer tool results are cut (they're resent on the next model call)
READ_CACHE_TTL = 60  # seconds a read-only tool result is reused
IDLE_PING_AFTER = 120  # seconds idle before a kept connection is pinged first (a ping is ~1s)

STATE_KEY = "connector_tools"  # in agno session_state: {"run": n, "used": {tool: run}}

_results = ExactCache(ttl=READ_CACHE_TTL)


# ---- connections (opened lazily, on the first tool call) ----


class _Live:
    def __init__(self, token: str, mcp: MCPTools):
        self.token = token
        self.mcp = mcp
        self.last_used = time.monotonic()


_live: dict[tuple[str, str], _Live] = {}
_locks: dict[tuple[str, str], asyncio.Lock] = {}


async def _session(user_id: str, c: Connector) -> MCPTools:
    """An open MCP connection for this user and connector; raises if it can't be had."""
    key = (user_id, c.id)
    async with _locks.setdefault(key, asyncio.Lock()):  # one connect at a time per key
        token = await auth.access_token(user_id, c)
        if not token:
            raise auth.ConnectorError(f"{c.name} is not connected")
        live = _live.get(key)
        if live and live.token == token and live.mcp.initialized:
            idle = time.monotonic() - live.last_used
            if idle < IDLE_PING_AFTER or await live.mcp.is_alive():
                live.last_used = time.monotonic()
                return live.mcp
        if live:
            await disconnect(user_id, c.id)

        started = time.monotonic()
        mcp = MCPTools(
            url=c.url,
            transport="streamable-http",
            headers={"Authorization": f"Bearer {token}"},
            tool_name_prefix=c.id,  # avoids clashes, e.g. two servers both exposing "search"
            refresh_connection=False,  # we check liveness ourselves, not on every run
        )
        await mcp.connect()  # logs and leaves initialized=False on failure
        if not mcp.initialized:
            raise auth.ConnectorError(f"Could not reach {c.name}")
        # The catalog needs tool annotations, which agno's own listing drops, so
        # list again (~2s) - but only when the cached catalog is missing or stale.
        cached = catalog.cached(c)
        if cached is None or not cached[1]:
            listed = await mcp.session.list_tools()
            catalog.store(c, list(listed if isinstance(listed, list) else listed.tools))
        _live[key] = _Live(token, mcp)
        logger.info("connector %s connected in %.1fs", c.id, time.monotonic() - started)
        return mcp


async def disconnect(user_id: str, connector_id: str) -> None:
    if live := _live.pop((user_id, connector_id), None):
        await live.mcp.close()
    _results.drop(f"{user_id}:{connector_id}:")


async def close_all() -> None:
    for key in list(_live):
        await disconnect(*key)


# ---- catalog for a user ----


async def user_specs(user_id: str) -> list[ToolSpec]:
    """Every tool of the user's switched-on connectors, from the catalog.

    A connector never listed before is connected once to learn its tools; a stale
    catalog is refreshed in the background so this run doesn't wait.
    """
    specs: list[ToolSpec] = []
    missing: list[Connector] = []
    for cid, enabled in db.list_connected(user_id).items():
        c = CONNECTORS.get(cid)
        if not enabled or c is None:
            continue
        entry = catalog.cached(c)
        if entry is None:
            missing.append(c)
            continue
        found, fresh = entry
        specs += found
        if not fresh:
            asyncio.create_task(_refresh(user_id, c))
    if missing:
        results = await asyncio.gather(*(_session(user_id, c) for c in missing), return_exceptions=True)
        for c, result in zip(missing, results):
            if isinstance(result, Exception):
                logger.warning("connector %s unavailable: %s", c.id, result)
            elif entry := catalog.cached(c):
                specs += entry[0]
    return specs


async def _refresh(user_id: str, c: Connector) -> None:
    try:
        await disconnect(user_id, c.id)
        await _session(user_id, c)
    except Exception as e:
        logger.warning("catalog refresh for %s failed: %s", c.id, e)


# ---- calling ----


async def call(user_id: str, spec: ToolSpec, arguments: dict) -> str:
    c = CONNECTORS[spec.connector]
    scope = f"{user_id}:{c.id}:"
    key = scope + ExactCache.make_hash(spec.name, arguments)
    if spec.read_only and (hit := _results.get(key)) is not None:
        logger.info("tool %s: cache hit", spec.name)
        return hit

    started = time.monotonic()
    try:
        mcp = await _session(user_id, c)
    except Exception as e:
        return f"Error: {e}"
    fn = mcp.functions.get(spec.name)
    if fn is None:
        return f"Error: {c.name} no longer offers {spec.server_name}."
    result = await fn.entrypoint(**arguments)  # agno returns errors as text, never raises
    text = str(getattr(result, "content", result) or "")
    if len(text) > MAX_RESULT_CHARS:
        text = text[:MAX_RESULT_CHARS] + f"\n…[cut: {len(text) - MAX_RESULT_CHARS} more chars. Narrow the query for the rest.]"

    if spec.read_only:
        if not text.startswith("Error"):
            _results.set(key, text)
    else:
        _results.drop(scope)  # a write can change what the reads would return
    logger.info("tool %s: %.1fs, %d chars", spec.name, time.monotonic() - started, len(text))
    return text


# ---- per-session memory of which tools are in use ----


class _Usage:
    """Wraps session_state[STATE_KEY]; agno saves session_state with the session."""

    def __init__(self, run_context):
        state = run_context.session_state
        if state is None:
            state = run_context.session_state = {}
        self.data = state.setdefault(STATE_KEY, {"run": 0, "used": {}})

    def next_run(self) -> None:
        self.data["run"] += 1
        run = self.data["run"]
        self.data["used"] = {n: r for n, r in self.data["used"].items() if run - r < STICKY_RUNS}

    def mark(self, *names: str) -> None:
        for n in names:
            self.data["used"][n] = self.data["run"]

    def sticky(self) -> list[str]:
        """Most recently used first."""
        return sorted(self.data["used"], key=lambda n: -self.data["used"][n])


def mark_used(run_context, names: list[str]) -> None:
    """For skills: attach a skill's allowed tools to the chat from the next run on."""
    _Usage(run_context).mark(*names)


def attached_now(run_context) -> set[str]:
    """Connector tools attached natively in the current run."""
    return set(_Usage(run_context).data.get("native", []))


# ---- routing: attach obvious tools directly ----


def route(query: str, specs: list[ToolSpec]) -> tuple[list[ToolSpec], str]:
    """Tools to attach for this message, and why (for the logs)."""
    if not query or not specs:
        return [], "no query"
    named = catalog.mentioned_connectors(query, sorted({s.connector for s in specs}))
    if named:
        pool = [s for s in specs if s.connector in named]
        picked = [s for score, s in catalog.search(pool, query)[:MAX_ROUTED] if score >= NAMED_MIN_SCORE]
        # Naming the app but no clear tool ("check reclaim"): its core tools, in the
        # registry's include_tools order (the order a person would reach for them).
        for s in sorted(pool, key=_registry_rank):
            if len(picked) >= NAMED_FILL:
                break
            if s not in picked:
                picked.append(s)
        return picked, f"named {','.join(named)}"
    hits = catalog.search(specs, query)
    if not hits or hits[0][0] < OBVIOUS_SCORE:
        return [], f"no obvious tool (best {hits[0][0]:.1f} {hits[0][1].name})" if hits else "no match"
    top = hits[0][0]
    picked = [s for score, s in hits[:MAX_ROUTED] if score >= top * 0.6]
    return picked, f"matched (best {top:.1f})"


def _registry_rank(spec: ToolSpec) -> int:
    order = CONNECTORS[spec.connector].include_tools or []
    return order.index(spec.server_name) if spec.server_name in order else len(order)


# ---- the run's tool list ----


def compact_json(schema: dict) -> str:
    return json.dumps(schema, separators=(",", ":"))


def model_safe_schema(schema):
    """The tool's JSON schema without `null` in `enum` lists.

    MCP servers write optional enums as `"type": ["string", "null"], "enum": [..., null]`;
    Gemini's schema type accepts only string enum values and fails the whole run on a None
    (seen with typeform_forms-public_get_form: `enum.3 Input should be a valid string`). The
    nullable `type` still allows null, so dropping it from `enum` changes nothing else.
    """
    if isinstance(schema, list):
        return [model_safe_schema(v) for v in schema]
    if not isinstance(schema, dict):
        return schema
    out = {k: model_safe_schema(v) for k, v in schema.items()}
    if isinstance(out.get("enum"), list):
        out["enum"] = [v for v in out["enum"] if v is not None]
    return out


def _native(user_id: str, spec: ToolSpec, usage: _Usage) -> Function:
    async def run(**kwargs) -> str:
        args = {k: v for k, v in kwargs.items() if not k.startswith("_agno_")}
        usage.mark(spec.name)
        return await call(user_id, spec, args)

    return Function(
        name=spec.name,
        description=spec.description,
        parameters=model_safe_schema(spec.schema),
        entrypoint=run,
        skip_entrypoint_processing=True,
    )


def _meta_tools(user_id: str, specs: list[ToolSpec], usage: _Usage, native: list[ToolSpec]) -> list[Function]:
    by_name = {s.name: s for s in specs}
    apps = ", ".join(sorted({CONNECTORS[s.connector].name for s in specs}))
    # Live runs showed the model searching for tools it already had (4 wasted
    # round trips), so say which ones are attached where it decides to search.
    attached = (
        f" Already attached, call these directly instead: {', '.join(s.name for s in native)}."
        if native else ""
    )

    async def search_tools(query: str, limit: int = 5) -> str:
        hits = catalog.search(specs, query)[: max(1, min(limit, 10))]
        if not hits:
            names = ", ".join(by_name)
            return f"No match for '{query}'. All tools: {names}"
        lines = [f"{s.name}: {s.summary}" for _, s in hits]
        best_score, best = hits[0]
        if len(hits) == 1 or best_score >= CLEAR_WINNER * hits[1][0]:
            # Clear winner: hand its schema over now, saving the get_tool round trip
            # (each round resends the whole prompt; ~2k tokens on the live runs).
            usage.mark(best.name)
            return "\n".join(lines) + f"\nArguments of {best.name}: {compact_json(best.schema)}\nNext: call_tool(name, arguments)."
        return "\n".join(lines) + "\nNext: get_tool(name) for its arguments, then call_tool(name, arguments)."

    async def get_tool(name: str) -> str:
        spec = by_name.get(name)
        if spec is None:
            return f"No tool '{name}'. Use search_tools first."
        usage.mark(name)  # likely to be used: attach it directly next time
        return compact_json({"name": name, "description": spec.description, "parameters": spec.schema})

    async def call_tool(name: str, arguments: dict | None = None) -> str:
        spec = by_name.get(name)
        if spec is None:
            return f"No tool '{name}'. Use search_tools first."
        usage.mark(name)
        return await call(user_id, spec, arguments or {})

    def meta(fn, description: str, properties: dict, required: list[str]) -> Function:
        return Function(
            name=fn.__name__,
            description=description,
            parameters={"type": "object", "properties": properties, "required": required},
            entrypoint=fn,
            skip_entrypoint_processing=True,
        )

    return [
        meta(
            search_tools,
            f"Find tools in the user's connected apps ({apps}) that aren't attached yet.{attached}",
            {"query": {"type": "string", "description": "What you want to do, e.g. 'add a task'"},
             "limit": {"type": "integer", "description": "Max results (default 5)"}},
            ["query"],
        ),
        meta(
            get_tool,
            "Get a connected-app tool's description and argument schema.",
            {"name": {"type": "string"}},
            ["name"],
        ),
        meta(
            call_tool,
            "Run a connected-app tool by name. Get its schema with get_tool first unless you already have it.",
            {"name": {"type": "string"},
             "arguments": {"type": "object", "description": "Arguments matching the tool's schema"}},
            ["name"],
        ),
    ]


async def user_connector_tools(run_context) -> list[Function]:
    """This run's connector tools: meta tools + whatever is attached natively."""
    user_id = run_context.user_id
    if not user_id:
        return []
    specs = await user_specs(user_id)
    if not specs:
        return []

    usage = _Usage(run_context)
    usage.next_run()
    by_name = {s.name: s for s in specs}
    query = (run_context.metadata or {}).get("query", "")
    routed, why = route(query, specs)
    sticky = [by_name[n] for n in usage.sticky() if n in by_name]

    native: list[ToolSpec] = []
    for s in routed + sticky:
        if s not in native and len(native) < MAX_NATIVE:
            native.append(s)

    logger.info(
        "run %s tools: catalog=%d routed=[%s] (%s) sticky=[%s] native=%d",
        run_context.run_id[:8], len(specs), ",".join(s.name for s in routed), why,
        ",".join(s.name for s in sticky), len(native),
    )
    usage.data["native"] = [s.name for s in native]  # for skills: don't resend these schemas

    # Speculative connect: a routed tool will probably be called, so open its
    # connection now, while the model thinks, not after it asks (~7s cold).
    for cid in {s.connector for s in routed}:
        if (user_id, cid) not in _live:
            asyncio.create_task(_warm(user_id, CONNECTORS[cid]))

    return _meta_tools(user_id, specs, usage, native) + [_native(user_id, s, usage) for s in native]


async def _warm(user_id: str, c: Connector) -> None:
    try:
        await _session(user_id, c)
    except Exception as e:
        logger.warning("pre-connect to %s failed: %s", c.id, e)
