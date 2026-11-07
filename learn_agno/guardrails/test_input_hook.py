"""
Tests for input_hook.py. No LLM or network calls.

Run from the repo root:
    .venv/bin/python -m unittest learn_agno.guardrails.test_input_hook -v
or:
    .venv/bin/python learn_agno/guardrails/test_input_hook.py -v

How to know redaction worked: don't trust the model's reply. Inspect the input
AFTER the hooks ran, i.e. what the model would have received.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agno.agent import Agent
from agno.exceptions import CheckTrigger, InputCheckError
from agno.guardrails.pii import PIIDetectionGuardrail
from agno.models.groq import Groq
from agno.run import RunStatus
from agno.run.agent import RunInput

from input_hook import MAX_INPUT_CHARS, build_pre_hooks, input_hook_length

PHONE = "8700865291"
AADHAAR = "8225 8736 2866"


def run_hooks(text: str, mask_pii: bool = True) -> str:
    """Run the real hook chain on text and return what the model WOULD receive."""
    run_input = RunInput(input_content=text)
    for hook in build_pre_hooks(mask_pii=mask_pii):
        if hasattr(hook, "check"):
            hook.check(run_input)
        else:
            hook(run_input)
    return run_input.input_content_string()


class TestMasking(unittest.TestCase):
    def test_phone_is_masked_and_original_gone(self):
        out = run_hooks(f"My contact is +91 {PHONE}, repeat it")
        self.assertNotIn(PHONE, out)
        self.assertIn("*" * len(PHONE), out)

    def test_surrounding_text_is_preserved(self):
        out = run_hooks(f"My contact is +91 {PHONE}, repeat it")
        self.assertTrue(out.startswith("My contact is +91 "))
        self.assertTrue(out.endswith(", repeat it"))

    def test_aadhaar_masked_in_all_separator_styles(self):
        for raw in ["8225 8736 2866", "8225-8736-2866", "822587362866"]:
            with self.subTest(raw=raw):
                out = run_hooks(f"aadhaar {raw} thanks")
                self.assertNotIn(raw, out)
                self.assertNotIn("8225", out)

    def test_aadhaar_cannot_start_with_0_or_1(self):
        # Real Aadhaar numbers start with 2-9; the pattern relies on that.
        out = run_hooks("code 1234 5678 9012")
        self.assertIn("1234 5678 9012", out)

    def test_multiple_pii_types_in_one_input(self):
        out = run_hooks(f"phone {PHONE} aadhaar {AADHAAR}")
        self.assertNotIn(PHONE, out)
        self.assertNotIn(AADHAAR, out)

    def test_clean_input_is_unchanged(self):
        text = "Hi how are you"
        self.assertEqual(run_hooks(text), text)


class TestBlockingMode(unittest.TestCase):
    def test_block_mode_raises_with_pii_type(self):
        with self.assertRaises(InputCheckError) as ctx:
            run_hooks(f"call me on {PHONE}", mask_pii=False)
        self.assertEqual(ctx.exception.check_trigger, CheckTrigger.PII_DETECTED)
        self.assertIn("Phone", ctx.exception.additional_data["detected_pii"])

    def test_block_mode_reports_custom_pattern_name(self):
        with self.assertRaises(InputCheckError) as ctx:
            run_hooks(f"aadhaar {AADHAAR}", mask_pii=False)
        self.assertIn("aadhar_pattern", ctx.exception.additional_data["detected_pii"])


class TestLengthAndOrder(unittest.TestCase):
    def test_length_limit_boundary(self):
        run_hooks("a" * MAX_INPUT_CHARS)  # exactly at the limit: allowed
        with self.assertRaises(InputCheckError):
            run_hooks("a" * (MAX_INPUT_CHARS + 1))

    def test_length_check_runs_before_pii(self):
        """Long input that ALSO has a phone number must fail on LENGTH, and the
        PII guardrail must never be reached."""
        calls = []

        class SpyPII(PIIDetectionGuardrail):
            def check(self, run_input):
                calls.append("pii")
                return super().check(run_input)

        run_input = RunInput(input_content=("x" * MAX_INPUT_CHARS) + PHONE)
        hooks = [input_hook_length, SpyPII(mask_pii=True)]
        with self.assertRaises(InputCheckError) as ctx:
            for hook in hooks:
                hook.check(run_input) if hasattr(hook, "check") else hook(run_input)
        self.assertEqual(ctx.exception.check_trigger, CheckTrigger.INPUT_NOT_ALLOWED)
        self.assertEqual(calls, [], "PII hook ran even though length check failed")


class TestRealAgentPipeline(unittest.TestCase):
    """Run the hooks through a real Agent, but stop BEFORE the LLM is called.

    A final 'tripwire' hook records the input and raises InputCheckError, so the
    run aborts there. If the tripwire saw masked text, the model would have too.
    """

    def _received_by_model(self, text: str) -> str:
        seen = {}

        def tripwire(run_input: RunInput) -> None:
            seen["input"] = run_input.input_content_string()
            raise InputCheckError("tripwire: stop before LLM")

        agent = Agent(
            model=Groq(id="openai/gpt-oss-120b"),
            pre_hooks=[*build_pre_hooks(), tripwire],
        )
        # agent.run() does NOT raise InputCheckError: it catches it and returns a
        # RunOutput with status=error and the message as content.
        response = agent.run(text)
        self.assertEqual(response.status, RunStatus.error)
        self.assertIn("tripwire", response.content)
        return seen["input"]

    def test_blocked_input_returns_error_status_not_exception(self):
        agent = Agent(model=Groq(id="openai/gpt-oss-120b"), pre_hooks=build_pre_hooks())
        response = agent.run("x" * (MAX_INPUT_CHARS + 1))  # no try/except needed
        self.assertEqual(response.status, RunStatus.error)
        self.assertIn("too long", response.content)

    def test_agent_masks_before_model(self):
        out = self._received_by_model(f"My number is +91 {PHONE}, repeat it")
        self.assertNotIn(PHONE, out)
        self.assertIn("*" * len(PHONE), out)

    def test_agent_masks_aadhaar_before_model(self):
        out = self._received_by_model(f"aadhaar {AADHAAR} please")
        self.assertNotIn(AADHAAR, out)


class TestKnownGaps(unittest.TestCase):
    """Bypasses that currently get through. These are expected failures: when you
    fix the guardrail, they start 'unexpectedly succeeding', so remove the
    decorator then."""

    @unittest.expectedFailure
    def test_indian_5_5_phone_format(self):
        out = run_hooks("call +91 87008 65291")
        self.assertNotIn("87008 65291", out)

    @unittest.expectedFailure
    def test_dashed_5_5_phone_format(self):
        out = run_hooks("call +91-87008-65291")
        self.assertNotIn("87008-65291", out)

    @unittest.expectedFailure
    def test_spelled_out_digits(self):
        out = run_hooks("call eight seven zero zero eight six five two nine one")
        self.assertNotIn("eight seven zero zero", out)

    @unittest.expectedFailure
    def test_no_false_positive_on_order_id(self):
        # A harmless 10-digit order id should NOT be treated as a phone number.
        out = run_hooks("order id 1234567890")
        self.assertIn("1234567890", out)


if __name__ == "__main__":
    unittest.main()
