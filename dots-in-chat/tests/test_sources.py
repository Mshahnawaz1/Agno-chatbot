"""Offline tests for source cards (app/agent/sources.py).

Run from dots-in-chat/:
    PYTHONPATH=. python -m unittest tests.test_sources -v
"""
import os
import tempfile
import unittest
from pathlib import Path

_tmp = tempfile.mkdtemp()
os.environ["APP_DB_PATH"] = os.path.join(_tmp, "app.db")
os.environ["AGENT_WORKSPACE_DIR"] = os.path.join(_tmp, "ws")

from app.agent import sources  # noqa: E402

PDF_BYTES = b"%PDF-1.4 test"


def ref(*docs):
    return [{"query": "q", "references": list(docs)}]


def doc(name, content, **meta):
    return {"name": name, "content": content, "meta_data": meta}


class SourceCards(unittest.TestCase):
    def setUp(self):
        kb = Path(tempfile.mkdtemp())
        (kb / "guide.pdf").write_bytes(PDF_BYTES)
        sources.KB_SOURCE_DIR = kb

    def test_card_has_file_page_chunk_snippet_and_workspace_path(self):
        refs = ref(doc("guide.pdf", "Robust detection models degrade under gaussian noise.", page=4, chunk=2))
        cards = sources.build_sources(refs, "Detection models degrade under gaussian noise, robust ones less.", "u1")
        self.assertEqual(len(cards), 1)
        c = cards[0]
        self.assertEqual((c["name"], c["page"], c["chunk"], c["path"]), ("guide.pdf", 4, 2, "sources/guide.pdf"))
        self.assertIn("gaussian noise", c["snippet"])
        self.assertEqual((sources.workspace_for("u1") / "sources" / "guide.pdf").read_bytes(), PDF_BYTES)

    def test_irrelevant_retrieval_gives_no_cards(self):
        refs = ref(doc("guide.pdf", "Bibliography entries about object detectors.", page=9))
        self.assertEqual(sources.build_sources(refs, "The capital of France is Paris.", "u1"), [])

    def test_duplicates_collapse_and_best_first(self):
        weak = doc("guide.pdf", "robust models degrade detection accuracy", page=1)
        strong = doc("guide.pdf", "robust models degrade detection accuracy under gaussian noise badly", page=2)
        reply = "Robust models degrade detection accuracy under gaussian noise."
        cards = sources.build_sources(ref(weak, strong) + ref(strong), reply, "u1")
        self.assertEqual([c["page"] for c in cards], [2, 1])

    def test_answer_that_found_nothing_gives_no_cards(self):
        refs = ref(doc("guide.pdf", "Robust detection models degrade under gaussian noise.", page=4, chunk=2))
        reply = "I searched the knowledge base but the results didn't contain any relevant matches (they were about detection models and noise)."
        self.assertEqual(sources.build_sources(refs, reply, "u1"), [])

    def test_inline_text_has_no_file(self):
        refs = ref(doc("\n    I liv", "I live in Bengaluru and work as software developer", chunk=1))
        cards = sources.build_sources(refs, "You live in Bengaluru and work as a software developer.", "u1")
        self.assertEqual((cards[0]["name"], cards[0]["path"]), ("Note", None))

    def test_name_cannot_escape_the_knowledge_dir(self):
        for bad in ("../secret.pdf", "/etc/passwd", ".hidden.pdf", "missing.pdf"):
            self.assertIsNone(sources.workspace_copy("u1", bad))


if __name__ == "__main__":
    unittest.main()
