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
from app.agent import agent  # noqa: E402
from app.skills import skill_files, skills  # noqa: E402

db.init_db()
BLOCK = re.compile(r"<a2ui>.*?</a2ui>", re.DOTALL)


def ctx(run_id="r1", session_id="check-only"):
    return SimpleNamespace(run_id=run_id, session_id=session_id, user_id=None)


class SkillFilesTest(unittest.TestCase):
    def test_references_match_the_catalog(self):
        self.assertEqual(stale(), [], "run: PYTHONPATH=. python -m app.a2ui.skill_build")

    def test_skill_md_names_only_files_that_exist(self):
        a2ui = skills.get_skill("a2ui")
        files = skill_files(a2ui)
        named = set(re.findall(r"((?:references|templates)/[\w.<>-]+\.md)", a2ui.instructions))
        for f in named - {"references/block-<name>.md"}:
            self.assertIn(f, files)
        self.assertLess(len(a2ui.instructions), 6000, "SKILL.md must stay small: it is loaded often")

    def test_every_template_passes_check(self):
        for f in (SKILL_DIR / "templates").glob("*.md"):
            for block in BLOCK.findall(f.read_text()):
                if "update=true" in block or "deleteSurface" in block:
                    continue  # needs an earlier surface; covered in test_a2ui
                with self.subTest(f.name):
                    out = skills.get_skill_script("a2ui", "check.py", ctx(), args=[block])
                    self.assertTrue(out.startswith("OK"), out)

    def test_check_reports_errors_with_a_fix(self):
        out = skills.get_skill_script(
            "a2ui", "check.py", ctx(), args=['<a2ui>\nsurface("s")\ncard = Card(Text("Hi"))\nroot = card\n</a2ui>']
        )
        self.assertTrue(out.startswith("ERRORS"), out)
        self.assertIn("Fix:", out)


class LazyLoadTest(unittest.TestCase):
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
            "a2ui", c, paths=["references/grammar.md", "templates/form.md", "references/nope.md"]))
        self.assertIn("## Workflow", out)
        self.assertIn("--- references/grammar.md ---", out)  # preloaded and also asked for: once
        self.assertEqual(out.count("--- references/grammar.md ---"), 1)
        self.assertIn("--- references/components.md ---", out)  # preloaded
        self.assertIn("--- templates/form.md ---", out)
        self.assertIn("No file 'references/nope.md'", out)
        again = asyncio.run(skills.get_skill_instructions("a2ui", c, paths=["references/grammar.md"]))
        self.assertNotIn("## Workflow", again)
        self.assertIn("already loaded above", again)
        self.assertIn("paths=[...]", again)  # tells the model how to get more
        self.assertNotIn("--- ", again)
        fresh = asyncio.run(skills.get_skill_instructions("a2ui", ctx("next-run")))
        self.assertIn("## Workflow", fresh)  # a new run loads it again


if __name__ == "__main__":
    unittest.main()
