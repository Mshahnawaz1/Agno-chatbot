"""Checks this skill against the catalogs (stale references, undocumented components, broken examples).

Run from dots-in-chat/:   PYTHONPATH=. python skills/a2ui/scripts/check.py
The logic is app/a2ui/skill_check.py; the references are rebuilt with app/a2ui/skill_build.py.
"""

import runpy
import sys

sys.exit(runpy.run_module("app.a2ui.skill_check", run_name="__main__")["main"]())
