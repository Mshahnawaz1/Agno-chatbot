"""Groq model that keeps the model's reasoning.

gpt-oss on Groq returns its reasoning in `delta.reasoning` / `message.reasoning`
(https://console.groq.com/docs/reasoning), but agno 3.1.12's Groq parser reads only
`content` and `tool_calls` (agno/models/groq/groq.py, _parse_provider_response_delta),
so the reasoning was dropped. Copying it into `reasoning_content` makes agno stream it
as RunContentEvent.reasoning_content, the same way it does for Gemini thoughts.
"""
from agno.models.groq import Groq
from agno.models.response import ModelResponse


class ReasoningGroq(Groq):
    def _parse_provider_response(self, response, **kwargs) -> ModelResponse:
        model_response = super()._parse_provider_response(response, **kwargs)
        if response.choices:
            reasoning = getattr(response.choices[0].message, "reasoning", None)
            if reasoning:
                model_response.reasoning_content = reasoning
        return model_response

    def _parse_provider_response_delta(self, response) -> ModelResponse:
        model_response = super()._parse_provider_response_delta(response)
        if response.choices and response.choices[0].delta is not None:
            reasoning = getattr(response.choices[0].delta, "reasoning", None)
            if reasoning:
                model_response.reasoning_content = reasoning
        return model_response
