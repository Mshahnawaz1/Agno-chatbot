from agno.agent import Agent
from agno.models.groq import Groq

import os
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# One shared instance. Never put user_id/session_id here; pass them per call.
agent = Agent(
    model=Groq(
            id="openai/gpt-oss-120b"
        ),
    instructions="You are a helpful assistant.",
)