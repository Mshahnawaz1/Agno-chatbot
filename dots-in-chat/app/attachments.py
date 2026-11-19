"""Files a user attaches to a message: workspace paths, written into the model's input.

The agent already reads workspace files by path (read_file, or the pdf / microsoft-office skill
scripts), so an attachment is just a marker line it can see. The history endpoint splits the
marker back off, so a stored turn shows the user's words plus file chips, not the marker.
"""
import json
import re

HINT = "attached workspace files, read them with the matching file skill"
_MARKER = re.compile(r"\n\n\[Attached files \([^)]*\): (\[.*\])\]\s*$", re.S)


def with_attachments(text: str, paths: list[str]) -> str:
    if not paths:
        return text
    return f"{text}\n\n[Attached files ({HINT}): {json.dumps(paths, ensure_ascii=False)}]"


def split_attachments(text: str) -> tuple[str, list[str]]:
    """(the user's text, attached paths) from a stored turn input."""
    m = _MARKER.search(text)
    if not m:
        return text, []
    try:
        paths = json.loads(m.group(1))
    except ValueError:
        return text, []
    if not isinstance(paths, list) or not all(isinstance(p, str) for p in paths):
        return text, []
    return text[:m.start()], paths
