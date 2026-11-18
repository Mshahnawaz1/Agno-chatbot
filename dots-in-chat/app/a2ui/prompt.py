"""The hidden repair run's prompt. Everything else the model knows about A2UI is the a2ui skill
(skills/ui-forms, ui-blocks, ui-display: SKILL.md, references built from the catalog by
skill_build.py, templates, and scripts/check.py), loaded only for replies that show UI. None of it is in the system prompt.
"""

REPAIR_PROMPT = """The A2UI compiler rejected part of your last reply, so the user did not see it:
{errors}
Surfaces that exist now: {surfaces}.
Send only a corrected A2UI block that completes the UI, with the same surfaceId. If that surface
exists, update it with `surface("<id>", update=true)`; if it doesn't, create it with
`surface("<id>")`. Keep prose outside the <a2ui> tags. Don't apologise or explain. If unsure of a signature, load it
with get_skill_instructions("<ui skill>", paths=[...]) and check the block with its check.py script."""
