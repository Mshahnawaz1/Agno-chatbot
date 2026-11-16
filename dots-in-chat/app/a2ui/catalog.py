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
its guide goes into the prompt under Catalog Instructions.
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

BASIC_COMPONENTS = [
    "Text", "Image", "Icon",
    "Row", "Column", "List", "Card", "Tabs", "Divider",
    "Button", "TextField", "CheckBox", "ChoicePicker", "Slider", "DateTimeInput",
]

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

BLOCKS_GUIDE_HEAD = """Chat blocks: ready-made interactive cards. Prefer a block over building the same thing
from basic components or a VegaChart: a block recalculates live, keeps the design's look and
sends well-defined events. A block is usually the first child of root = Column([...]), with a
Suggestions under it. Update a block in place (surface(id, update=true) and the same component
name) to change its values; it then shows a "changed" badge."""


def _blocks() -> tuple[dict, list[str]]:
    """Every chat block's schema, and its guide line for the prompt."""
    components: dict = {}
    guides: list[str] = []
    for path in sorted((CATALOGS_DIR / "blocks").glob("*.json")):
        doc = json.loads(path.read_text())
        components.update(doc["components"])
        guides.append("- " + doc["guide"])
    return components, guides


BLOCK_COMPONENTS, _BLOCK_GUIDES = _blocks()


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


def _chat_catalog() -> Catalog:
    basic = BasicCatalog(ProtocolVersion.V1_0)
    vega = Catalog.from_json(json.loads((CATALOGS_DIR / "vegachart_v1.json").read_text()))
    blocks = Catalog.from_json(_catalog_doc("dots-in-chat/blocks/v1", BLOCK_COMPONENTS))
    return basic.derive(
        catalog_id=CATALOG_ID,
        components=[
            *BASIC_COMPONENTS,
            vega.components["VegaChart"],
            *(blocks.components[name] for name in BLOCK_COMPONENTS),
        ],
        instructions=INSTRUCTIONS + "\n\n" + BLOCKS_GUIDE_HEAD + "\n" + "\n".join(_BLOCK_GUIDES),
    )


CATALOG = _chat_catalog()

# The chat frontend renders this catalog only, so every request has the same capabilities.
CAPABILITIES = {PROTOCOL_VERSION: {"supportedCatalogIds": [CATALOG_ID]}}

GENERATOR = A2uiGenerator(
    catalogs=[CatalogConfig(catalog=CATALOG)],
    inference_format_factory=ExpressFormatFactory(),
)


def new_processor() -> A2uiRequestProcessor:
    """A processor for one request: compiles replies and makes renderer states."""
    return GENERATOR.create_processor(CAPABILITIES)


# The catalog is fixed, so one snippet serves every request.
PROMPT_SNIPPET = new_processor().prompt_snippet
