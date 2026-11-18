
"""
Run
python3 metrics.py
"""
import sys as _sys, pathlib as _pl  # run logs -> data/logdb/logs.db (runlog.py at the repo root)
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parents[1]))
import runlog; runlog.start("learn_agno/" + _pl.Path(__file__).stem)
from agno.db.sqlite import SqliteDb
from agno.agent import Agent
from rich.pretty import pprint

agent_db = SqliteDb(db_file="data/agno.db")

agent = Agent(
    db=agent_db,
)

# print("Chat histor" + "*" * 30)
# pprint(agent.get_chat_history()) #

# print("Session messages" + "*" * 30)
# pprint(agent.get_session_messages())

print("Session metrics" + "*" * 30)
session_m = agent.get_session_metrics()

print(f"input : {session_m.input_tokens}")
print(session_m.output_tokens)
print(session_m.total_tokens)
print(session_m.details["model"])
