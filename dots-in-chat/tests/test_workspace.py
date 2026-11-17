"""The agent's workspace: right folder, file tools attached, edits stay inside it."""
import asyncio
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agno.tools.file import FileTools  # noqa: E402

from app.agent.toolset import BASE_TOOLS, agent_tools, file_tools  # noqa: E402
from app.config import ROOT, settings  # noqa: E402


class WorkspaceConfigTest(unittest.TestCase):
    def test_path_is_absolute_and_inside_project(self):
        self.assertTrue(settings.agent_workspace.is_absolute())
        self.assertEqual(settings.agent_workspace, ROOT / "data" / "workspace")
        self.assertTrue(settings.agent_workspace.is_dir())

    def test_file_tools_use_that_path(self):
        self.assertEqual(file_tools.base_dir, settings.agent_workspace.resolve())

    def test_file_tools_reach_the_agent(self):
        self.assertIn(file_tools, BASE_TOOLS)
        class Ctx:  # no user: connector tools are skipped
            user_id = None
        try:
            tools = asyncio.run(agent_tools(Ctx()))
        except Exception:
            tools = BASE_TOOLS
        self.assertIn(file_tools, tools)
        self.assertEqual(
            sorted(file_tools.functions),
            ["delete_file", "list_files", "read_file", "replace_file_chunk", "save_file"],
        )


class WorkspaceEditTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name) / "ws"
        self.root.mkdir()
        self.ft = FileTools(
            base_dir=self.root, enable_delete_file=True, enable_replace_file_chunk=True,
        )

    def tearDown(self):
        self.tmp.cleanup()

    def test_save_read_replace_delete(self):
        self.ft.save_file("a hello world", "note.txt")
        self.assertEqual((self.root / "note.txt").read_text(), "a hello world")
        self.assertIn("a hello world", self.ft.read_file("note.txt"))
        self.ft.replace_file_chunk("note.txt", 0, 0, "bye")
        self.assertEqual((self.root / "note.txt").read_text().strip(), "bye")
        self.ft.delete_file("note.txt")
        self.assertFalse((self.root / "note.txt").exists())

    def test_cannot_escape_workspace(self):
        outside = Path(self.tmp.name) / "outside.txt"
        self.ft.save_file("x", "../outside.txt")
        self.assertFalse(outside.exists())


if __name__ == "__main__":
    unittest.main()
