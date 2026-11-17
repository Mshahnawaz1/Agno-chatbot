"""Offline tests for the a2ui skill (skills/a2ui/) and the lazy skill tools (app/skills.py).

Run from dots-in-chat/:
    PYTHONPATH=. python -m unittest tests.test_a2ui_skill -v
"""

import asyncio
import os
import re
import tempfile
import unittest
from types import SimpleNamespace

_tmp = tempfile.mkdtemp()
os.environ["APP_DB_PATH"] = os.path.join(_tmp, "app.db")  # before app.config is imported

from app import db  # noqa: E402
from app.a2ui.skill_build import SKILL_DIR, stale  # noqa: E402
from app.a2ui.turn import A2uiTurn  # noqa: E402
from app.agent import agent  # noqa: E402
from app.skills import skill_files, skills  # noqa: E402

db.init_db()
BLOCK = re.compile(r"<a2ui>\n.*?</a2ui>", re.DOTALL)


def ctx(run_id="r1", session_id="check-only"):
    return SimpleNamespace(run_id=run_id, session_id=session_id, user_id=None)


class SkillFilesTest(unittest.TestCase):
    def test_references_match_the_catalog(self):
        self.assertEqual(stale(), [], "run: PYTHONPATH=. python -m app.a2ui.skill_build")

    def test_skill_md_names_only_files_that_exist(self):
        a2ui = skills.get_skill("a2ui")
        files = skill_files(a2ui)
        named = set(re.findall(r"(references/[\w.<>-]+\.md)", a2ui.instructions))
        for f in named - {"references/block-<name>.md"}:
            self.assertIn(f, files)
        self.assertLess(len(a2ui.instructions), 6000, "SKILL.md must stay small: it is loaded often")

    def test_every_example_block_compiles(self):
        texts = {"SKILL.md": (SKILL_DIR / "SKILL.md").read_text(),
                 "form.md": (SKILL_DIR / "references" / "form.md").read_text()}
        for name, text in texts.items():
            for block in BLOCK.findall(text):
                with self.subTest(name):
                    turn = A2uiTurn("example-check")
                    turn.start_pass()
                    turn.feed(block)
                    turn.close()
                    self.assertEqual(turn.rejected, [])

    def test_chart_guide_specs_are_valid_and_accepted_by_the_catalog(self):
        import json

        guide = (SKILL_DIR / "references" / "chart-choice.md").read_text()
        specs = re.findall(r"^`(\{.*\})`$", guide, re.MULTILINE)
        self.assertGreaterEqual(len(specs), 5)
        for spec in specs:
            with self.subTest(spec[:40]):
                json.loads(spec)
                turn = A2uiTurn("chart-guide-check")
                turn.start_pass()
                turn.feed(f'<a2ui>\nsurface("c")\nroot = Card(VegaChart({spec}, 300))\n</a2ui>')
                turn.close()
                self.assertEqual(turn.rejected, [])

    def test_routing_table_names_real_blocks_and_chart_files_bring_the_chart_guide(self):
        skill = skills.get_skill("a2ui")
        files = skill_files(skill)
        for block in (SKILL_DIR / "references").glob("block-*.md"):
            self.assertIn(block.stem.removeprefix("block-"), skill.instructions)
        for f in ("references/block-charts.md", "references/chart.md", "references/block-chartgallery.md"):
            out = asyncio.run(skills.get_skill_instructions("a2ui", ctx(f"run-{f}"), paths=[f]))
            self.assertIn("--- references/chart-choice.md ---", out, f)
        self.assertIn("references/chart-choice.md", files)
        guide = (SKILL_DIR / "references" / "chart-choice.md").read_text()
        self.assertIn("ordered=false", guide)  # ChartSwitcher defaults ordered=true: categories got line/area
        self.assertIn("partsOfWhole", guide)

    def test_a_rejected_block_is_quoted_back_in_the_repair_prompt(self):
        bad = '<a2ui>\nsurface("s")\ncard = Card(Text("Hi"))\nroot = card\n</a2ui>'
        turn = A2uiTurn("repair-check")
        turn.start_pass()
        turn.feed(bad)
        turn.close()
        self.assertTrue(turn.rejected)
        prompt = turn.repair_prompt()
        self.assertIn("root = card", prompt)  # the previous response
        self.assertIn("Fix:", prompt)  # the hint for the error


class LazyLoadTest(unittest.TestCase):
    def test_default_load_is_for_forms_and_a_block_load_skips_form_components(self):
        form = asyncio.run(skills.get_skill_instructions("a2ui", ctx("run-form"), paths=[]))
        for f in ("references/grammar.md", "references/components.md", "references/form.md"):
            self.assertIn(f"--- {f} ---", form)
        block = asyncio.run(skills.get_skill_instructions(
            "a2ui", ctx("run-block"), paths=["references/block-budget.md"]))
        self.assertIn("--- references/grammar.md ---", block)
        self.assertIn("--- references/block-budget.md ---", block)
        self.assertNotIn("--- references/components.md ---", block)
        self.assertLess(len(block), len(form) + 1500)
        self.assertLess(len(block), 13000, "a block turn's load must stay small")

    def test_no_search_round_trip_and_no_model_script_for_a2ui(self):
        names = [t.name for t in skills.get_tools()]
        self.assertNotIn("search_skills", names)  # few skills: the index lists them all
        self.assertNotIn("get_skill_script", names)
        self.assertIn("get_skill_instructions", names)

    def test_index_lists_file_names_so_one_call_can_load_a_block(self):
        snippet = skills.get_system_prompt_snippet()
        self.assertIn("block-budget", snippet)
        self.assertIn("paths=", snippet)

    def test_tool_arguments_are_not_names_agno_drops(self):
        # Seen live: a `files` argument was silently dropped ("framework-injected parameters").
        from agno.tools import function as agno_function

        reserved = set(agno_function.FRAMEWORK_INJECTED_PARAMS) | set(agno_function.AGNO_INJECTED_PARAMS)
        for tool in skills.get_tools():
            tool.process_entrypoint()
            with self.subTest(tool.name):
                self.assertFalse(set(tool.parameters["properties"]) & reserved, tool.parameters)

    def test_system_prompt_has_no_a2ui_catalog(self):
        snippet = skills.get_system_prompt_snippet()
        self.assertIn("a2ui:", snippet)
        joined = " ".join(map(str, agent.instructions))
        for text in (snippet, joined):
            self.assertNotIn("Positional Component Signatures", text)
            self.assertNotIn("ChoicePicker(", text)

    def test_one_call_loads_instructions_and_files_and_repeats_are_stubbed(self):
        c = ctx("run-batch")
        out = asyncio.run(skills.get_skill_instructions(
            "a2ui", c, paths=["references/grammar.md", "references/form.md", "references/nope.md"]))
        self.assertIn("## Match the request", out)
        self.assertIn("--- references/grammar.md ---", out)  # preloaded and also asked for: once
        self.assertEqual(out.count("--- references/grammar.md ---"), 1)
        self.assertNotIn("--- references/components.md ---", out)  # default_paths: only with no paths
        self.assertIn("--- references/form.md ---", out)
        self.assertIn("No file 'references/nope.md'", out)
        again = asyncio.run(skills.get_skill_instructions("a2ui", c, paths=["references/grammar.md"]))
        self.assertNotIn("## Match the request", again)
        self.assertIn("already loaded above", again)
        self.assertIn("paths=[...]", again)  # tells the model how to get more
        self.assertNotIn("--- ", again)
        fresh = asyncio.run(skills.get_skill_instructions("a2ui", ctx("next-run"), paths=[]))
        self.assertIn("## Match the request", fresh)  # a new run loads it again


if __name__ == "__main__":
    unittest.main()
