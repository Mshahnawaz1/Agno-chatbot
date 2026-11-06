
"""
Run
python3 metrics.py
"""
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
