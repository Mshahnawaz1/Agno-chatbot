"""
Run:
python3 learn_agno/preh.py
"""


from agno.agent import Agent
from agno.models.groq import Groq
from agno.run.agent import RunInput, RunOutput
from agno.exceptions import CheckTrigger, InputCheckError, OutputCheckError
from rich.pretty import pprint

import os
from dotenv import load_dotenv
load_dotenv()

from ingestion import get_weather
from utils import validate_input, validate_output

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL")


def input_hook_length(run_input: RunInput) -> None:
    text = run_input.input_content_string()
    print(f"hook called, lenght of text: {len(text)}")
    if len(text) > 100:
        raise InputCheckError(
            f"Input too long: {len(text)} chars (max 100).",
            check_trigger=CheckTrigger.INPUT_NOT_ALLOWED,
        )

def output_hook_validate(run_output: RunOutput) -> None:
    text = run_output.content
    print(f"[output hook] called, type={type(text).__name__}, len={len(str(text))}")

    if "hello" in str(text).lower():
        raise OutputCheckError(
            "Output contains a blocked word: 'hello'",
            check_trigger=CheckTrigger.OUTPUT_NOT_ALLOWED,
        )
    

def main():
    # One shared instance. Never put user_id/session_id here; pass them per call.
    agent = Agent(
        model=Groq(id="openai/gpt-oss-120b"),
        tools = [get_weather],
        instructions="You are a helpful assistant.",
        pre_hooks=[input_hook_length],
        post_hooks=[output_hook_validate],
        # post_hooks=[validate_output]
    )

    print(f"Testing input valid hook")
    try:
        response = agent.run("Hi how are you?")
        print(response.content)
    except InputCheckError as e:
        print(f"Input lenght is large, make it smaller. Error: {e}")
    
    print("***" * 20)
    print(f"Testing invalid input hook")
    try:
        response = agent.run(
            "Hi how are you? This is A hybrid in the hybrid retrieval, we combine semantic search, retrieve context chunks with the chunks retrieved from using lexical search using the word. A semantic search is search in which we use vectors and the embeddings to search similar chunks, types of chunks. Whereas in lexical search, we use a word to search. So, one case in which semantic search would likely fail in, for example, we have to retrieve a value for a word like from the JSON. We need the exact key to retrieve the value, but using the semantic we might not be able to get that exact key but only around its meaning, whereas using a direct word matching or lexical search we can directly search that same exact word. Second question, RRF, that is reverse, uh, it is used to combine these chunks taken from hybrid and semantic search. And K here is a constant which controls the weightage of ranks, weightage of ranks of context. For example, the higher value of K gives uh, more weightage to the lower ranks chunks. In this way, we could use it to distribute the importance of top ranked search context. Third question is uh, with the 3000 chunk size and no overlap, one thing would go wrong is to split a piece of information in which we don't have context of the other part. So we will get only half uh, informations of each part and won't be able to get the proper information. For this, we could use recursive chunks in which we will have an overlap of the of a fixed size of chunks."
            )
        print(response.content)
    except InputCheckError as e:
        print(f"Input lenght is large, make it smaller. Error: {e}")

    print("###" * 20)
    print(f"Testing valid output hook")
    try:
        response = agent.run(
            "What is AI? in 20 words"
            )
        print(f"ouput succes: {response.content}")
    except OutputCheckError as e:
        print(f"Output is invalid. Error: {e}")

    print("***" * 20)
    print(f"Testing invalid ouput hook")
    try:
        response = agent.run(
            "Reply with only one word. hello "
            )
        print(f"ouput success: {response.content}")
    except OutputCheckError as e:
        print(f"Ouput is invalid. Error: {e}")



if __name__ == "__main__":
    main()
