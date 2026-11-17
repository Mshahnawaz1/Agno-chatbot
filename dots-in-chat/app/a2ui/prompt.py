"""The hidden repair run's prompt: the A2UI docs' validate-and-retry loop (the retry prompt quotes the
previous response and the validation error). Everything else the model knows about A2UI is the a2ui
skill (skills/a2ui/: SKILL.md, references built from the catalog by skill_build.py plus hand-written form and chart guides),
loaded only for replies that show UI. None of it is in the system prompt.
"""

REPAIR_PROMPT = """Your previous response:
{previous}

The A2UI compiler rejected part of it, so the user did not see it:
{errors}
Surfaces that exist now: {surfaces}.
Fix the A2UI output so every component and ID matches the catalog. Send only a corrected A2UI
block that completes the UI, with the same surfaceId. If that surface exists, update it with
`surface("<id>", update=true)`; if it doesn't, create it with `surface("<id>")`. Keep prose
outside the <a2ui> tags. Don't apologise or explain. If unsure of a signature, load it with
get_skill_instructions("a2ui", paths=[...])."""
