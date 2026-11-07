# Topic 4: Guardrail Actions (what happens when a check fails)

Detecting a problem is half the job. The other half is the action. Same check,
different action = very different security and UX.

## The 5 actions
| Action | What it does | Use when | Cost / risk |
|---|---|---|---|
| Block | stop the run, return an error | secrets, injection, clearly unsafe | worst UX, safest |
| Redact / mask | remove the bad part, continue | PII the task doesn't need | original may still be logged |
| Append / fix up | add what's missing | disclaimer missing | only for harmless gaps |
| Retry | regenerate with feedback | format, length, tone | extra LLM call; can loop; may fail again |
| Fallback / escalate | safe canned reply, or send to a human | high stakes (finance, medical) | needs a human process |

Rule of thumb: the more irreversible or sensitive the problem, the harder the
action (block/escalate). Cosmetic problems get softer actions (fix up/retry).

## Decision questions
1. Can the task still succeed without the bad part? -> redact
2. Is it the user's mistake or the model's mistake? User's -> tell them what to
   change. Model's -> they don't need details, retry or fallback quietly.
3. Is the bad content already out (streamed, stored, sent)? Then blocking is too late.
4. Should the user be told WHY? Telling attackers which rule fired helps them
   tune the attack; telling honest users helps them fix their input.

## How each action looks in Agno (verified by running a mocked model)
- Redact: mutate `run_output.content` in a post-hook ->
  `response.content` and the stored session run both show the redacted text.
- Block (input): `run()` returns status=error and content = the error message.
- Block (output): `run()` returns status=error BUT `response.content` STILL
  HOLDS THE ORIGINAL UNSAFE TEXT, and the session db stores it too.
  So `print(response.content)` after a blocked output leaks it. Always
  branch on `response.status` first, and show your own safe message.
- Retry: Agno has no built-in guardrail retry. You write the loop around
  `agent.run()` (max 2 tries, feed the failure reason back in the prompt).
- Fallback: after status==error, return a fixed message from the API layer.

## Gotchas
- Mask/redact still lets the original reach logs, db and request bodies.
- Retry loops need a cap and must re-run ALL guardrails on the new answer.
- Error messages are an information leak: "blocked: matched pattern X".
- Log the event (trigger + hash or type, NOT the raw secret) so you can see
  how often each guardrail fires.
- Be consistent: same input type, same action.
