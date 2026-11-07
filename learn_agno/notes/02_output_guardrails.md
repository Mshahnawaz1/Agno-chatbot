# Topic 2: Output Guardrails (post-hooks)

## What it is
A check that runs on the model's response AFTER generation, BEFORE the caller
gets it. Input guardrails protect the model from the user; output guardrails
protect the user (and your company) from the model.

Why you need both: input checks can't predict what the model will say. A
perfectly clean question can still produce leaked data, unsafe advice, a
made-up fact, or off-brand text. The model can also leak things the USER never
typed: system prompt text, tool results, retrieved documents, other users'
data.

## How Agno does it
```python
Agent(post_hooks=[fn, ...])
def my_hook(run_output: RunOutput) -> None: ...
```
- Receives `RunOutput`; the text is `run_output.content` (can be a str OR a
  Pydantic object when `output_schema` is set, so use `str(...)` carefully).
- BLOCK: `raise OutputCheckError(msg, check_trigger=CheckTrigger.OUTPUT_NOT_ALLOWED)`
- SANITIZE: mutate `run_output.content` and return.
- Runs after the whole response exists (and after tool calls have already run).
- Same rules as pre-hooks:
  - hooks run in list order; first OutputCheckError stops the chain
  - other exceptions are logged and swallowed, so the hook FAILS OPEN
  - `async def` hooks are skipped by `run()`; use `arun()`
  - `run()` does not raise: you get `RunOutput(status=RunStatus.error,
    content=<error message>)`. Always check `response.status`.
- No built-in output guardrail ships in `agno.guardrails` (PII, injection,
  moderation are all input-side). You write these yourself.

## Streaming caveat (verified in agno/agent/_run.py)
With `stream=True`, content tokens are sent to the client first, then
`RunContentCompletedEvent` fires, and ONLY THEN do post-hooks run. So a
post-hook cannot stop text that was already streamed. Options:
- don't stream for sensitive agents
- buffer the stream and release it after checking
- run a lightweight check on chunks as they arrive (in your own stream loop)

## Kinds of output check
| Check | Example | Method |
|---|---|---|
| Leakage: PII / secrets | email, API key, system prompt echoed | regex, secret scanners |
| Safety / toxicity | harmful instructions, abuse | moderation API, LLM judge |
| Policy / domain | financial bot promising returns, giving "guaranteed" advice | rules + LLM judge |
| Grounding | answer not supported by retrieved docs | LLM judge, citation check |
| Format / schema | must be JSON, <200 words, has disclaimer | rules, Pydantic |
| Length | max chars | rules |

## Output actions (preview of Topic 4)
- Block: replace with a safe message. Safest, worst UX.
- Redact: mask the bad part, keep the rest.
- Retry: regenerate with feedback (costs another LLM call).
- Append: add a missing disclaimer.

## Gotchas
- A keyword check like `"hello" in text` blocks "shell" -> false positives.
  Word boundaries (`\b`) matter.
- Tools have already RUN by the time a post-hook sees the output. Output
  guardrails can't undo side effects (emails sent, orders placed).
- Structured output: `content` may not be a string.
- Check whether blocked output still gets saved to session history/db.
