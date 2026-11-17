"""A2UI (https://a2ui.org) v1.0 for the chat, built on the official `a2ui-agent-sdk`.

- catalog.py:     the catalog and the SDK generator (compiler, validator, prompt text)
- skill_build.py: cuts the generated prompt text into the a2ui skill's references
- prompt.py:      the repair prompt (the rest is the skill, skills/a2ui/)
- turn.py:        compiles one streamed reply into text and A2UI messages
- store.py:       keeps what each turn showed, for history and later turns
- actions.py:     validates clicks coming back from a surface
"""
