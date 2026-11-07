from agno.guardrails.pii import PIIDetectionGuardrail
from agno.run.agent import RunInput, RunOutput
from agno.exceptions import CheckTrigger, InputCheckError, OutputCheckError
from agno.utils.log import logger

import time
from typing import Any, Callable, Dict
import httpx

MAX_INPUT_CHARS = 300

# PII guardrail
piiGuardrails = PIIDetectionGuardrail(
    mask_pii=True,
    custom_patterns= {"aadhar_pattern": r"(?<!\d)[2-9]\d{3}([ -]?)\d{4}\1\d{4}(?![ -]?\d)"}
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

def post_logger_hook(
        function
)