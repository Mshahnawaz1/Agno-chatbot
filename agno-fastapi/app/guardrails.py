from agno.guardrails.pii import PIIDetectionGuardrail
from agno.run.agent import RunInput, RunOutput
from agno.exceptions import CheckTrigger, InputCheckError, OutputCheckError
from agno.utils.log import logger

import time
from typing import Any, Callable, Dict
import httpx
import re


MAX_INPUT_CHARS = 300
BLOCKED_WORD = re.compile(r"\bhello\b", re.IGNORECASE)


# PII guardrail
piiGuardrails = PIIDetectionGuardrail(
    mask_pii=True,
    custom_patterns={
        "aadhar_pattern": r"(?<!\d)[2-9]\d{3}([ -]?)\d{4}\1\d{4}(?![ -]?\d)",
        "ip_address": r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
        "date_of_birth": (
            r"\b(?:DOB|born|birthday|date of birth)[:\s]+"
            r"\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\b"
        ),
        "passport": r"\b[A-Z]{1,2}\d{6,9}\b",
    },
    )

def input_length_guardrail(run_input: RunInput) -> None:
    text = run_input.input_content_string()
    logger.info(f"Input hook is called. Length of text: {len(text)}")
    if len(text) > MAX_INPUT_CHARS:
        raise InputCheckError(
            f"Input too long: {len(text)} chars (max {MAX_INPUT_CHARS}).",
            check_trigger=CheckTrigger.INPUT_NOT_ALLOWED,
        )


def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    r = httpx.get(f"https://wttr.in/{city}?format=3")
    return r.text

def tool_logger_hook(
    function_name: str,
    function_call: Callable,
    arguments: Dict[str, Any],
):
    start = time.time()
    result = function_call(**arguments)
    logger.info(f"Function called: {function_name} took {time.time() - start:.2f}s")
    return result

def output_hook_validate(run_output: RunOutput) -> None:
    text = run_output.content
    logger.info(f"[output hook] called, type={type(text).__name__}, len={len(str(text))}")

    if BLOCKED_WORD.search(str(text)):
        raise OutputCheckError(
            "Output contains a blocked word: 'hello'",
            check_trigger=CheckTrigger.OUTPUT_NOT_ALLOWED,
        )