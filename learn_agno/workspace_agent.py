"""
An agent that can manage files in the repo-root workspace/ directory.

Run:
python3 learn_agno/workspace_agent.py
"""

from pathlib import Path

from agno.agent import Agent
from agno.models.groq import Groq
from agno.tools.file import FileTools
from dotenv import load_dotenv

load_dotenv()

WORKSPACE_DIR = Path(__file__).resolve().parent.parent / "workspace"

# FileTools is confined to WORKSPACE_DIR.
file_tools = FileTools(
    base_dir=WORKSPACE_DIR,
    enable_save_file=True,
    enable_replace_file_chunk=True,
    enable_delete_file=True,
    enable_list_files=True,
    enable_search_files=True,
    enable_read_file=True,
    enable_read_file_chunk=False,
    enable_search_content=False,
)

agent = Agent(
    model=Groq(id="openai/gpt-oss-120b"),
    tools=[file_tools],
    instructions=(
        "You are a workspace assistant. You can only read and write files in the workspace directory. "
        "You can also create new file. If there is issue with the commands or error say to the user."
    ),
)

if __name__ == "__main__":
    while True:
        print("Agent is running")
        user_input = str(input("Human: "))
        agent.print_response(user_input)
        
