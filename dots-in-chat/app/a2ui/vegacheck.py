"""Checks a VegaChart's `spec` against the official Vega-Lite JSON schema before it is shown.

A model writes Vega-Lite from memory, and radar, gauge or waterfall charts invite invented keys
(`"coordinates": "polar"`, `"closed": true`). The browser then draws nothing and the reply still
says "here is your chart". The schema (vendored from the vega-lite npm package the frontend
uses, `catalogs/vega-lite-schema.json`) names the exact path and key, so a rejected block gets a
precise error and is repaired like any other.
"""

import json
from functools import lru_cache
from pathlib import Path

from jsonschema import Draft7Validator
from jsonschema.exceptions import best_match

SCHEMA = Path(__file__).parent / "catalogs" / "vega-lite-schema.json"
GUIDE = Path(__file__).parents[2] / "skills" / "a2ui" / "references" / "chart-choice.md"
PREFIX = "VegaChart spec is not valid"
POINTER = (
    "Fix the spec; for radar, gauge, heatmap, waterfall, scatter, histogram, area copy the"
    " matching recipe from the a2ui skill (references/chart-choice.md) and change only its data."
)


@lru_cache(maxsize=1)
def _validator() -> Draft7Validator:
    return Draft7Validator(json.loads(SCHEMA.read_text()))


def _leaf(error):
    """The most specific error inside the schema's anyOf/oneOf alternatives."""
    while error.context:
        error = best_match(error.context)
    return error


def problem(spec) -> str | None:
    """Why `spec` is not valid Vega-Lite, or None. Full Vega specs and bindings are not checked."""
    if not isinstance(spec, dict) or "marks" in spec:
        return None
    error = best_match(_validator().iter_errors(spec))
    if error is None:
        return None
    leaf = _leaf(error)
    where = "/".join(str(p) for p in leaf.absolute_path) or "(top level)"
    return f"{PREFIX} Vega-Lite at {where}: {leaf.message[:220]}. {POINTER}"


def recipes() -> str:
    """The chart guide's working specs (label line, then the spec), for a repair prompt: a model
    that wrote an invalid spec twice from memory copies a recipe when it sees one."""
    lines = GUIDE.read_text().split("\n")
    return "\n".join(
        f"{lines[i - 1]}\n{line}" for i, line in enumerate(lines) if line.startswith("`{") and line.endswith("}`")
    )


def problems(messages: list[dict]) -> list[str]:
    """The problems of every VegaChart in these wire messages."""
    out = []
    for m in messages:
        body = m.get("createSurface") or m.get("updateComponents") or {}
        for c in body.get("components", []):
            if c.get("component") == "VegaChart" and (msg := problem(c.get("spec"))):
                out.append(msg)
    return out
