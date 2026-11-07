"""
Run:
python3 learn_agno/guardrails/input_hook.py
"""

from agno.agent import Agent
from agno.models.groq import Groq
from agno.run.agent import RunInput, RunOutput
from agno.exceptions import CheckTrigger, InputCheckError, OutputCheckError
from rich.pretty import pprint
from agno.guardrails.pii import PIIDetectionGuardrail

import os
from dotenv import load_dotenv
load_dotenv()


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL")


def get_llm():
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    llm = Groq(id="openai/gpt-oss-120b")
    return llm

MAX_INPUT_CHARS = 300


def input_hook_length(run_input: RunInput) -> None:
    text = run_input.input_content_string()
    print(f"hook called, lenght of text: {len(text)}")
    if len(text) > MAX_INPUT_CHARS:
        raise InputCheckError(
            f"Input too long: {len(text)} chars (max {MAX_INPUT_CHARS}).",
            check_trigger=CheckTrigger.INPUT_NOT_ALLOWED,
        )


def build_pre_hooks(mask_pii: bool = True) -> list:
    """Single source of truth for the hook chain, so tests exercise the real thing."""
    return [
        input_hook_length,
        PIIDetectionGuardrail(
            mask_pii=mask_pii,
            custom_patterns={
                "aadhar_pattern": r"(?<!\d)[2-9]\d{3}([ -]?)\d{4}\1\d{4}(?![ -]?\d)",
            },
        ),
    ]


def main():
    llm = get_llm()
    agent = Agent(
        model=llm,
        pre_hooks=build_pre_hooks(),
        instructions= "You are a helpful assitant. Dont exceed you output from 100 words"
        )

    print(f"Running first test, no redaction")
    try:
        response = agent.run("Hi how are you")
        print(f"Response: {response.content}")
    except InputCheckError as e:
        print(f"Invalid Input run, Error: {e}")

    print("***" * 20)
    print(f"Testing invalid input hook")
    try:
        response = agent.run("My number is +91 8700865291, tell what number I have given")
        print(f"Response: {response.content}")
    except InputCheckError as e:
        print(f"Invalid PII run, Error: {e}")

    try:
        response = agent.run("My contact is +91 8700865291, and addhar number  is 8225 8736 2866 can you give my number and addhar back to me")
        print(f"Response with addhar and numnber: {response.content}")
    except InputCheckError as e:
        print(f"Invalid PII run, Error: {e}")   

if __name__ == "__main__":
    main()
