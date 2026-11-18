"""Lets `pytest` find the `app` package when run from the repo root."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Test runs log to the shared run-log DB too (data/logdb/logs.db), as app "dots-in-chat-tests".
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import runlog  # noqa: E402

runlog.start("dots-in-chat-tests")
