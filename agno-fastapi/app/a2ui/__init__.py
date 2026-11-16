"""A2UI (https://a2ui.org) v1.0 for the chat, built on the official `a2ui-agent-sdk`.

- catalog.py: the catalog and the SDK generator (prompt snippet, compiler, validator)
- prompt.py:  the agent's instructions (when to show UI) and the repair prompt
- turn.py:    compiles one streamed reply into text and A2UI messages
- store.py:   keeps what each turn showed, for history and later turns
- actions.py: validates clicks coming back from a surface
"""

from app.a2ui.prompt import A2UI_INSTRUCTIONS, A2UI_RULE

__all__ = ["A2UI_INSTRUCTIONS", "A2UI_RULE"]
