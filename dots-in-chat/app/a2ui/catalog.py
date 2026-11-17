"""The A2UI catalog the chat renders, and the SDK generator built from it.

The catalog is the single source of truth: the generator turns it into the model's prompt
snippet, and every processor made from the generator compiles and validates the model's
replies against the same catalog. The frontend implements the same components under the same
catalog id (frontend/src/features/chat/a2ui/catalog/).

The chat catalog is the official basic catalog (v1) plus the official VegaChart component
(catalogs/vegachart_v1.json, from a2ui-project/a2ui `catalogs/vegachart/v1/catalog.json` at
57f961f), plus the chat blocks (catalogs/blocks/*.json): interactive templates such as a SIP
calculator or an approval card, each of which keeps its own live state in the browser and sends
its own events. Media and Modal are left out: the chat doesn't need them.

A block file is {"guide": "<how the model uses it>", "components": {"<Name>": <JSON schema>}};
its guide goes into the a2ui skill (skill_build.py).
"""

import json
from pathlib import Path

from a2ui.core.basic_catalog import BasicCatalog
from a2ui.core.catalog.catalog import Catalog
from a2ui.core.schema import ProtocolVersion
from a2ui.inference_formats import ExpressFormatFactory
from a2ui.processor import A2uiGenerator, A2uiRequestProcessor, CatalogConfig

PROTOCOL_VERSION = "1.0"

# Our own id: the catalog is a derived one, not the basic catalog.
CATALOG_ID = "dots-in-chat/chat/v1"


# Catalog-level instructions go into the generated prompt under "Catalog Instructions".
INSTRUCTIONS = """VegaChart draws a Vega-Lite v5 chart from `spec` (a JSON object). Use it for any chart,
graph, plot or curve; never draw charts as text or ASCII.
- The chart runs in the user's browser. Vega-Lite `params` with `bind` become inputs drawn under
  the chart (`{"input": "range", "min", "max", "step"}` is a slider), and `transform`
  `calculate` / `filter` / `aggregate` expressions recompute from them as the user drags.
  So a calculator whose result must change live and that no chat block below covers (a loan,
  a custom formula) is ONE VegaChart whose inputs are its params; generate the rows with
  `"data": {"sequence": {...}}`.
- A2UI Slider, TextField and the other inputs only change the data model; nothing in A2UI can do
  arithmetic on them. A value computed from them reaches the screen only after a button sends
  an Event and you answer. Don't put A2UI sliders next to a chart and expect it to follow them.
- Inline data only (`"data": {"values": [...]}` or `sequence`); external URLs are blocked.
- Show computed totals in the chart itself (a layered `text` mark, or the tooltip), so they
  update with it.
Example: compound growth of a monthly deposit, live (note `root` is assigned the Card itself)
root = Card(Column([title, chart]))
title = Text("### Growth of a monthly deposit")
chart = VegaChart({"params": [{"name": "monthly", "value": 5000, "bind": {"input": "range", "min": 500, "max": 50000, "step": 500, "name": "Monthly amount "}}, {"name": "rate", "value": 10, "bind": {"input": "range", "min": 1, "max": 30, "step": 0.5, "name": "Yearly return % "}}], "data": {"sequence": {"start": 1, "stop": 121, "as": "month"}}, "transform": [{"calculate": "rate / 1200", "as": "r"}, {"calculate": "monthly * (pow(1 + datum.r, datum.month) - 1) / datum.r * (1 + datum.r)", "as": "value"}, {"calculate": "monthly * datum.month", "as": "invested"}, {"fold": ["value", "invested"]}], "mark": "line", "encoding": {"x": {"field": "month", "type": "quantitative"}, "y": {"field": "value", "type": "quantitative", "title": "Amount"}, "color": {"field": "key", "type": "nominal"}}}, 320)"""


CATALOGS_DIR = Path(__file__).parent / "catalogs"

def _blocks() -> dict:
    """Every chat block's schema (each file's guide goes into the a2ui skill, skill_build.py)."""
    components: dict = {}
    for path in sorted((CATALOGS_DIR / "blocks").glob("*.json")):
        components.update(json.loads(path.read_text())["components"])
    return components


BLOCK_COMPONENTS = _blocks()


def _catalog_doc(catalog_id: str, components: dict) -> dict:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": catalog_id,
        "protocolVersion": PROTOCOL_VERSION,
        "catalogId": catalog_id,
        "components": components,
        "$defs": {
            "anyComponent": {
                "oneOf": [{"$ref": f"#/components/{name}"} for name in components],
                "discriminator": {"propertyName": "component"},
            },
            "anyFunction": {"not": {}},
        },
    }


BASIC = BasicCatalog(ProtocolVersion.V1_0)
BASIC_ID = BASIC.catalog_id
BASIC_COMPONENTS = list(BASIC.components)
# The official VegaChart catalog, with this app's usage notes as its instructions.
VEGA = Catalog.from_json(json.loads((CATALOGS_DIR / "vegachart_v1.json").read_text()))
VEGA = VEGA.derive(catalog_id=VEGA.catalog_id, instructions=INSTRUCTIONS)
VEGA_ID = VEGA.catalog_id
BLOCKS_ID = "dots-in-chat/blocks/v1"
BLOCKS = Catalog.from_json(_catalog_doc(BLOCKS_ID, BLOCK_COMPONENTS))

# Every catalog the chat renders, each under its own id. A surface has no catalog of its own:
# each component names the catalog it is from (`catalogId` on the wire), so one card can mix
# a basic Column, a VegaChart and a chat block.
CATALOGS = [BASIC, VEGA, BLOCKS]
CATALOG_IDS = [c.catalog_id for c in CATALOGS]


def _merged_catalog() -> Catalog:
    """All components under CATALOG_ID, the one catalog the chat had before mixed catalogs.

    Surfaces stored back then name this id in createSurface; the client still renders it and
    `upgrade_message` rewrites them for the server. It also lists the component names
    (turn.py) and validates renderer messages (actions.py).
    """
    return BASIC.derive(
        catalog_id=CATALOG_ID,
        components=[*BASIC.components.values(), *VEGA.components.values(), *BLOCKS.components.values()],
    )


CATALOG = _merged_catalog()
COMPONENT_CATALOG = {name: cat.catalog_id for cat in CATALOGS for name in cat.components}


def _tag(component: dict) -> dict:
    cid = COMPONENT_CATALOG.get(component.get("component"))
    return {**component, "catalogId": cid} if cid and "catalogId" not in component else component


def upgrade_message(message: dict) -> dict:
    """A stored surface message from before mixed catalogs, in today's shape.

    `createSurface` named the one merged catalog; now it names none and each component names
    its own. Anything else passes through unchanged.
    """
    body = message.get("createSurface")
    if not isinstance(body, dict) or body.get("catalogId") != CATALOG_ID:
        return message
    body = {k: v for k, v in body.items() if k != "catalogId"}
    body["components"] = [_tag(c) for c in body.get("components", [])]
    return {**message, "createSurface": body}


GENERATOR = A2uiGenerator(
    catalogs=[CatalogConfig(catalog=c) for c in CATALOGS],
    inference_format_factory=ExpressFormatFactory(),
)

# The chat frontend renders all of them, so every request has the same capabilities.
CAPABILITIES = {PROTOCOL_VERSION: {"supportedCatalogIds": CATALOG_IDS}}


def new_processor() -> A2uiRequestProcessor:
    """A processor for one request: compiles replies and makes renderer states."""
    return GENERATOR.create_processor(CAPABILITIES)


# The SDK writes the same `weight` note under every basic component (15 x 211 chars, ~800
# tokens on every model call). Said once instead; the signatures still list `weight?`.
_WEIGHT_LINE = (
    "\n  - weight: The relative weight of this component within a Row or Column. This is similar"
    " to the CSS 'flex-grow' property. Note: this may ONLY be set when the component is a direct"
    " descendant of a Row or Column."
)
_SIGNATURES_HEAD = "Use these exact positional signatures to instantiate components. Do not output property keys:"
_WEIGHT_ONCE = (
    "\n`weight` (on every component that lists it): its flex-grow share, only on a direct child"
    " of a Row or Column."
)


def _compact(snippet: str) -> str:
    """The generated snippet without repeated text. Fails loudly if the SDK's wording changes."""
    if snippet.count(_WEIGHT_LINE) < 10 or _SIGNATURES_HEAD not in snippet:
        raise RuntimeError("a2ui-agent-sdk prompt wording changed: update _compact in catalog.py")
    snippet = snippet.replace(_WEIGHT_LINE, "")
    return snippet.replace(_SIGNATURES_HEAD, _SIGNATURES_HEAD + _WEIGHT_ONCE, 1)


# The catalog is fixed, so one snippet serves every request. It is not sent as a whole:
# skill_build.py cuts it into the a2ui skill's reference files.
PROMPT_SNIPPET = _compact(new_processor().prompt_snippet)
