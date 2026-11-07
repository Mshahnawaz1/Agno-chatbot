# Topic 1: Input Guardrails (pre-hooks)

## What it is
A check that runs on user input BEFORE the LLM is called. If it fails, the
run stops: no tokens spent, no tool calls, nothing can go wrong downstream.

Why input first: it's the cheapest place to stop a bad request. Blocking
costs ~0 tokens; letting it through and fixing the output costs a full LLM
call (and possibly tool side effects you can't undo).

## How Agno does it
```python
Agent(pre_hooks=[fn_or_guardrail, ...])
```
- A hook receives `RunInput`. Use `run_input.input_content_string()`
  (always a str). `input_content` may be a str, list, dict or Pydantic
  model, so `len(run_input.input_content)` is not safe.
- To BLOCK: `raise InputCheckError(msg, check_trigger=CheckTrigger.X)`
- To SANITIZE: mutate `run_input.input_content = cleaned` and return.
- Hooks run in list order, and the first failure stops the run. Put cheap
  checks first and the expensive LLM check last.
- `CheckTrigger` values used for input: INPUT_NOT_ALLOWED, OFF_TOPIC,
  PII_DETECTED, PROMPT_INJECTION.

## The 5 kinds of input check
| Check | Example | Typical method |
|---|---|---|
| Size / format | max length, empty input, language | rules |
| PII | SSN, card, email, phone | regex |
| Prompt injection / jailbreak | "ignore previous instructions" | keywords, then classifier or LLM |
| Scope / topic | financial bot gets a pizza question | LLM judge or embeddings |
| Safety / moderation | violence, market manipulation | moderation API or LLM judge |

## Built-in guardrails (agno.guardrails)
- `PIIDetectionGuardrail(mask_pii=False, custom_patterns={...})`
  - `mask_pii=False` blocks (PII_DETECTED); `mask_pii=True` replaces PII
    with `*` and continues.
- `PromptInjectionGuardrail(injection_patterns=[...])`: substring match.
- `OpenAIModerationGuardrail`: calls OpenAI's moderation API.
- `BaseGuardrail`: subclass it and implement `check` and `async_check` to
  make your own reusable guardrail. Use it as `pre_hooks=[MyGuardrail()]`.

## Limits to remember
- Keyword and regex checks are trivially bypassed (typos, other languages,
  base64, "ign0re"). They catch lazy attacks only.
- An LLM validator is itself an LLM reading attacker text, so it can be
  prompt-injected too. Never let its prompt be the only defense.
- Every LLM-based check adds latency and cost to EVERY request.
- Guardrails reduce risk; they don't remove it (see Topic 5).
- Use `async_check` for `arun()`, otherwise blocking calls stall the loop.
