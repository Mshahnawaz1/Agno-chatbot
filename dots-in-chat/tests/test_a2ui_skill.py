"""Offline tests for the a2ui skill (skills/a2ui/) and the lazy skill tools (app/agent/skills.py).

Run from dots-in-chat/:
    PYTHONPATH=. python -m unittest tests.test_a2ui_skill -v
"""

import asyncio
import os
import re
from pathlib import Path
import tempfile
import unittest
from types import SimpleNamespace

_tmp = tempfile.mkdtemp()
os.environ["APP_DB_PATH"] = os.path.join(_tmp, "app.db")  # before app.config is imported

from app import db  # noqa: E402
from app.a2ui.turn import A2uiTurn  # noqa: E402
from app.a2ui.skill_build import SKILLS_DIR, UI_SKILLS, stale  # noqa: E402
from app.agent import agent  # noqa: E402
from app.agent.skills import skill_files, skills  # noqa: E402

db.init_db()
BLOCK = re.compile(r"<a2ui>.*?</a2ui>", re.DOTALL)


def ctx(run_id="r1", session_id="check-only"):
    return SimpleNamespace(run_id=run_id, session_id=session_id, user_id=None)


class SkillFilesTest(unittest.TestCase):
    def test_references_match_the_catalog(self):
        self.assertEqual(stale(), [], "run: PYTHONPATH=. python -m app.a2ui.skill_build")

    def test_skills_follow_the_agent_skills_format(self):
        # Anthropic's rules: name <= 64 chars, lowercase/digits/hyphens, matches the folder;
        # description non-empty, <= 1024 chars, says what the skill does AND when to use it;
        # SKILL.md < 500 lines (700 for the unmodified hermes claude-design); every file it names exists (one level deep).
        for name in skills.get_skill_names():
            skill = skills.get_skill(name)
            with self.subTest(name):
                self.assertRegex(name, r"^[a-z0-9]+(-[a-z0-9]+)*$")
                self.assertLessEqual(len(name), 64)
                self.assertEqual(Path(skill.source_path).name, name)
                self.assertTrue(0 < len(skill.description) <= 1024)
                self.assertRegex(skill.description, r"\b[Uu]se\b", "say when to use the skill")
                self.assertLess(len(skill.instructions.splitlines()), 700)  # hermes claude-design is 658 lines; ours stay < 500 otherwise
                files = skill_files(skill)
                named = set(re.findall(r"((?:references|templates)/[\w.<>-]+\.md)", skill.instructions))
                for f in named - {"references/block-<name>.md"}:
                    self.assertIn(f, files)

    def test_ui_skills_preload_only_what_their_use_case_needs(self):
        for name in UI_SKILLS:
            skill = skills.get_skill(name)
            files = skill_files(skill)
            preload = skill.metadata["preload"].split()
            size = len(skill.instructions) + sum((Path(skill.source_path) / f).stat().st_size for f in preload)
            with self.subTest(name):
                for f in preload:
                    self.assertIn(f, files)
                self.assertLess(size, 17000, "a UI turn resends this on every model call")
        blocks = skills.get_skill("ui-blocks")
        self.assertNotIn("references/components.md", blocks.metadata["preload"])

    def test_every_template_passes_check(self):
        for f in (p for s in UI_SKILLS for p in (SKILLS_DIR / s / "templates").glob("*.md")):
            for block in BLOCK.findall(f.read_text(encoding="utf-8")):
                if "update=true" in block or "deleteSurface" in block:
                    continue  # needs an earlier surface; covered in test_a2ui
                with self.subTest(f.name):
                    turn = A2uiTurn("check-only")
                    turn.start_pass()
                    turn.feed(block)
                    turn.close()
                    self.assertEqual(turn.rejected, [])

    def test_repair_prompt_quotes_the_rejected_reply_and_the_error(self):
        reply = '<a2ui>\nsurface("s")\ncard = Card(Text("Hi"))\nroot = card\n</a2ui>'
        turn = A2uiTurn("check-only")
        turn.start_pass()
        turn.feed(reply)
        turn.close()
        self.assertTrue(turn.rejected)
        prompt = turn.repair_prompt()
        self.assertIn("card = Card(", prompt)
        self.assertIn(turn.rejected[0][:40], prompt)


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
        for name in UI_SKILLS:
            self.assertIn(f"{name}:", snippet)
        joined = " ".join(map(str, agent.instructions))
        for text in (snippet, joined):
            self.assertNotIn("Positional Component Signatures", text)
            self.assertNotIn("ChoicePicker(", text)

    def test_one_call_loads_instructions_and_files_and_repeats_are_stubbed(self):
        c = ctx("run-batch")
        out = asyncio.run(skills.get_skill_instructions(
            "ui-forms", c, paths=["references/grammar.md", "templates/form.md", "references/nope.md"]))
        self.assertIn("## Workflow", out)
        self.assertIn("--- references/grammar.md ---", out)  # preloaded and also asked for: once
        self.assertEqual(out.count("--- references/grammar.md ---"), 1)
        self.assertIn("--- references/components.md ---", out)  # preloaded
        self.assertIn("--- templates/form.md ---", out)
        self.assertIn("No file 'references/nope.md'", out)
        again = asyncio.run(skills.get_skill_instructions("ui-forms", c, paths=["references/grammar.md"]))
        self.assertNotIn("## Workflow", again)
        self.assertIn("already loaded above", again)
        self.assertIn("paths=[...]", again)  # tells the model how to get more
        self.assertNotIn("--- ", again)
        fresh = asyncio.run(skills.get_skill_instructions("ui-forms", ctx("next-run"), paths=[]))
        self.assertIn("## Workflow", fresh)  # a new run loads it again


if __name__ == "__main__":
    unittest.main()
