"""Replays the 43 official A2UI v1.0 basic-catalog examples through the app's server side.

Run from dots-in-chat/:
    PYTHONPATH=. python -m unittest tests.test_a2ui_examples -v

Server side = the chat catalog (app/a2ui/catalog.py) validating the messages: a fresh
renderer state per example, `state.apply(messages)`. Fixtures are copies of the upstream examples
(a2ui-project/a2ui `catalogs/basic/v1/examples`, commit 57f961f), in tests/fixtures/a2ui_examples/.
The chat registers one catalog, so each createSurface's catalogId is rewritten to CATALOG_ID.

Known gaps (tests/fixtures/known_gaps.json, "server") are asserted to STILL fail: when one is fixed,
the test fails and the entry must be deleted. The renderer side of the same replay is
frontend/e2e/examples.mjs.
"""

import copy
import json
import os
import unittest
from pathlib import Path

os.environ.setdefault("JWT_SECRET", "test-only")  # app.config needs these to import
os.environ.setdefault("CONNECTOR_SECRET", "test-only")

from app.a2ui.catalog import CATALOG_ID, new_processor  # noqa: E402

FIXTURES = Path(__file__).parent / "fixtures"
EXAMPLES = sorted((FIXTURES / "a2ui_examples").glob("*.json"))
KNOWN = json.loads((FIXTURES / "known_gaps.json").read_text())["server"]


def load(path: Path) -> list[dict]:
    messages = copy.deepcopy(json.loads(path.read_text())["messages"])
    for m in messages:
        if "createSurface" in m:
            m["createSurface"]["catalogId"] = CATALOG_ID
    return messages


def normalize_checks(node):
    """Spec-at-main spelling to the released packages' spelling: @checks -> checks, @accessibility -> accessibility."""
    if isinstance(node, dict):
        return {{"@checks": "checks", "@accessibility": "accessibility"}.get(k, k): normalize_checks(v) for k, v in node.items()}
    if isinstance(node, list):
        return [normalize_checks(v) for v in node]
    return node


def apply(messages):
    state = new_processor().create_state()
    state.apply(messages)
    return state


class ExamplesTest(unittest.TestCase):
    def test_all_43_fixtures_are_there(self):
        self.assertEqual(len(EXAMPLES), 43)

    def test_each_example_is_valid_for_the_chat_catalog(self):
        unexpected = []
        for path in EXAMPLES:
            name = path.stem
            with self.subTest(example=name):
                try:
                    apply(load(path))
                except Exception as e:  # A2uiValidationError and friends
                    if name not in KNOWN:
                        unexpected.append(f"{name}: {str(e)[:160]}")
                    continue
                self.assertNotIn(name, KNOWN, f"{name} now passes: remove it from known_gaps.json (server)")
        self.assertEqual(unexpected, [])

    def test_known_gaps_fail_for_the_documented_reason(self):
        for name, reason in KNOWN.items():
            with self.subTest(example=name):
                with self.assertRaises(Exception) as cm:
                    apply(load(FIXTURES / "a2ui_examples" / f"{name}.json"))
                self.assertIn(reason["match"], str(cm.exception))

    def test_at_checks_examples_pass_once_spelled_like_the_released_packages(self):
        # login-form and advanced-form-validator use `@checks`; SDK 0.11.0 only knows `checks`.
        for name in ("login-form", "advanced-form-validator"):
            with self.subTest(example=name):
                state = apply(normalize_checks(load(FIXTURES / "a2ui_examples" / f"{name}.json")))
                self.assertTrue(state.surface_ids)

    def test_every_example_creates_the_surface_it_updates(self):
        for path in EXAMPLES:
            with self.subTest(example=path.stem):
                messages = load(path)
                created = {m["createSurface"]["surfaceId"] for m in messages if "createSurface" in m}
                used = {
                    m[k]["surfaceId"] for m in messages for k in ("updateComponents", "updateDataModel") if k in m
                }
                self.assertTrue(used <= created)


if __name__ == "__main__":
    unittest.main()
