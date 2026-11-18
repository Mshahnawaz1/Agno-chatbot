"""Skills for the agent: agno's Skills, made lazier.

Sources: skills/<name>/SKILL.md (general) and connector_skills/<name>/SKILL.md
(how to use one connector). Both use agno's LocalSkills loader and SKILL.md format.

Compared with plain agno Skills:
- The system prompt block is a few lines instead of ~500 tokens of boilerplate.
  Up to INLINE_MAX skills are listed by name + description; with more, only
  search_skills finds them.
- search_skills(query) finds skills by keyword.
- get_skill_instructions(name, paths=[...]) returns SKILL.md, the files its
  `metadata.preload` names, and any requested files (references/, templates/) in
  ONE call: every extra call resends the whole context. A file already returned in
  this run comes back as a one-line stub.
  It also honours the SKILL.md `allowed-tools` list: those connector tools come
  back with their schemas (callable now through call_tool) and are attached
  directly to the chat from the next message on.
- get_skill_script runs a script (never returns its text: only output enters
  context), with this app's Python, the chat's session id, a timeout and an
  output cap. Offered only if some skill has scripts.
- Loaded skill text is stubbed out of stored history after the run
  (stub_skill_loads), so it isn't replayed in the next turns' context.
"""

import asyncio
import os
import subprocess
import sys
from pathlib import Path

from agno.run import RunContext
from agno.skills import LocalSkills, Skills
from agno.tools.function import Function

from app.connectors import catalog
from app.connectors import tools as connector_tools

ROOT = Path(__file__).resolve().parents[1]
SKILL_DIRS = [ROOT / "skills", ROOT / "connector_skills"]
INLINE_MAX = 8
FILE_DIRS = ("references", "templates")  # agno scans only references/ (and scripts/)
SCRIPT_TIMEOUT = 30
SCRIPT_OUTPUT_MAX = 4000
SKILL_TOOLS = ("get_skill_instructions",)
STUB = (
    "[Skill text removed from history to save tokens; it is NOT in context any more. Before using"
    " this skill again (e.g. writing UI), call get_skill_instructions again.]"
)


def _files_line(files: list[str]) -> str:
    """ Files: references/{grammar,chart}.md, templates/{form}.md (compact; the index is in every request)."""
    if not files:
        return ""
    groups: dict[str, list[str]] = {}
    for f in files:
        d, name = f.split("/", 1)
        groups.setdefault(d, []).append(name.removesuffix(".md"))
    return " Files: " + "; ".join(f"{d}/{{{','.join(n)}}}.md" for d, n in groups.items())


def _resolve(f: str, available: list[str]) -> str:
    """A requested file as listed: 'references/grammar.md', also without '.md' or the folder."""
    f = f.strip().lstrip("./")
    for cand in (f, f + ".md", *(f"{d}/{f}" for d in FILE_DIRS), *(f"{d}/{f}.md" for d in FILE_DIRS)):
        if cand in available:
            return cand
    return f


def skill_files(skill) -> list[str]:
    """The skill's loadable files as paths relative to its folder, e.g. references/grammar.md."""
    root = Path(skill.source_path)
    return [
        f"{d}/{p.name}" for d in FILE_DIRS if (root / d).is_dir()
        for p in sorted((root / d).iterdir()) if p.is_file() and not p.name.startswith(".")
    ]


class LazySkills(Skills):
    def get_system_prompt_snippet(self) -> str:
        skills = self.get_all_skills()
        if not skills:
            return ""
        lines = [
            "<skills>",
            "Playbooks, loaded only when a request matches: call get_skill_instructions(name) "
            "first, then follow it.",
        ]
        if len(skills) <= INLINE_MAX:
            for s in skills:
                lines.append(f"- {s.name}: {s.description}")
        else:
            lines.append(f"{len(skills)} skills exist; find them with search_skills(query).")
        lines.append("</skills>")
        return "\n".join(lines)

    def get_tools(self) -> list[Function]:
        tools = [
            Function.from_callable(self.search_skills),
            Function.from_callable(self.get_skill_instructions),
        ]
        skills = self.get_all_skills()
        if any(s.scripts for s in skills):
            tools.append(Function.from_callable(self.get_skill_script))
        return tools

    def search_skills(self, query: str) -> str:
        """Find skills (task playbooks) relevant to a request.

        Args:
            query: What the user wants to do.
        """
        q = set(catalog.tokens(query))
        scored = []
        for s in self.get_all_skills():
            words = catalog.tokens(f"{s.name.replace('-', ' ')} {s.description}")
            score = sum(1 for w in words if w in q)
            if score:
                scored.append((score, s))
        if not scored:
            # Keyword search misses paraphrases ("plan a weekend trip" vs. the a2ui skill's
            # "fill in details"): give every description so the model can judge (seen live).
            return "No keyword match. All skills:\n" + "\n".join(
                f"{s.name}: {s.description}" for s in self.get_all_skills())
        scored.sort(key=lambda x: -x[0])
        return "\n".join(f"{s.name}: {s.description}" for _, s in scored[:5])

    async def get_skill_instructions(
        self, skill_name: str, run_context: RunContext, paths: list[str] | None = None
    ) -> str:
        """Load a skill's instructions and, in the same call, any of its files.

        Args:
            skill_name: The skill's name.
            paths: Skill files to load too, e.g. ["references/chart.md", "templates/update.md"].
        """
        skill = self.get_skill(skill_name)
        if skill is None:
            return f"No skill '{skill_name}'. Available: {', '.join(self.get_skill_names())}"
        seen = _seen(run_context)
        out = []
        key = (skill.name, "SKILL.md")
        available = skill_files(skill)
        if key in seen:
            out.append(
                f"[{skill.name} instructions: already loaded above in this turn. To load more of its"
                f" files pass paths=[...]:{_files_line(available)}]"
            )
        else:
            seen.add(key)
            out.append(skill.instructions)
            # metadata.preload: files every use of the skill needs, sent with the instructions so
            # the model doesn't guess (seen live: it never asked for them and invented components).
            # (Not named `files`: agno drops tool arguments with that name, its media parameter.)
            paths = (skill.metadata or {}).get("preload", "").split() + list(paths or [])
        for f in dict.fromkeys(paths or []):
            f = _resolve(f, available)
            if f not in available:
                out.append(f"[No file '{f}' in {skill.name}. Files: {', '.join(available)}]")
            elif (skill.name, f) in seen:
                out.append(f"[{f}: already loaded above in this turn]")
            else:
                seen.add((skill.name, f))
                out.append(f"--- {f} ---\n" + (Path(skill.source_path) / f).read_text())
        if skill.scripts:
            out.append(f"Scripts (get_skill_script): {', '.join(skill.scripts)}")

        if skill.allowed_tools and run_context.user_id:
            specs = {s.name: s for s in await connector_tools.user_specs(run_context.user_id)}
            have = [specs[n] for n in skill.allowed_tools if n in specs]
            if have:
                connector_tools.mark_used(run_context, [s.name for s in have])
                attached = connector_tools.attached_now(run_context)
                direct = [s.name for s in have if s.name in attached]
                rest = [s for s in have if s.name not in attached]
                if direct:
                    out.append(f"Attached tools for this skill, call directly: {', '.join(direct)}")
                if rest:
                    out.append(
                        "More tools for this skill (call with call_tool(name, arguments)):\n"
                        + "\n".join(
                            connector_tools.compact_json({"name": s.name, "parameters": s.schema}) for s in rest
                        )
                    )
        return "\n\n".join(out)


    def get_skill_script(
        self, skill_name: str, script_path: str, run_context: RunContext, args: list[str] | None = None
    ) -> str:
        """Run a script of a skill (e.g. a checker) and return its output.

        Args:
            skill_name: The skill's name.
            script_path: The script's file name, e.g. "check.py".
            args: Arguments for the script.
        """
        skill = self.get_skill(skill_name)
        if skill is None or script_path not in skill.scripts:
            have = ", ".join(skill.scripts) if skill else "no such skill"
            return f"No script '{script_path}' in {skill_name}. Scripts: {have}"
        path = Path(skill.source_path) / "scripts" / script_path
        cmd = [sys.executable, str(path)] if path.suffix == ".py" else [str(path)]
        env = {**os.environ, "A2UI_SESSION_ID": run_context.session_id or ""}
        try:
            r = subprocess.run(
                [*cmd, *(args or [])], capture_output=True, text=True,
                timeout=SCRIPT_TIMEOUT, cwd=skill.source_path, env=env, check=False,
            )
        except subprocess.TimeoutExpired:
            return f"{script_path} timed out after {SCRIPT_TIMEOUT}s"
        text = r.stdout.strip() or r.stderr.strip()[-1500:] or f"(no output, exit {r.returncode})"
        return text[:SCRIPT_OUTPUT_MAX]


def _seen(run_context: RunContext) -> set:
    """Skill files returned in this run (a repeat load gets a stub: it's still in context)."""
    loaded = _loaded.setdefault(run_context.run_id, set())
    while len(_loaded) > 200:  # only the current runs matter
        _loaded.pop(next(iter(_loaded)))
    return loaded


_loaded: dict[str, set] = {}


async def stub_skill_loads(agent, session_id: str, run_ids: list[str]) -> None:
    """Replaces loaded skill text in these runs' stored messages with a one-line stub.

    agno replays the last runs' tool results as history (max_tool_calls_from_history), so a
    loaded skill (~18k chars for a2ui) would be resent on every later turn, UI or not. The
    model loads it again when it needs it (the stub says so). agno keeps each run in its own
    row (agno_runs), so the runs are rewritten there, not through the session object.
    """
    await asyncio.to_thread(_stub_runs, agent.db, session_id, run_ids)


def _stub_runs(db, session_id: str, run_ids: list[str]) -> None:
    for run_id in dict.fromkeys(run_ids):
        run = db.get_run(run_id)
        if run is None:
            continue
        changed = False
        for m in run.messages or []:
            if m.role == "tool" and m.tool_name in SKILL_TOOLS and len(str(m.content or "")) > len(STUB):
                m.content = STUB
                changed = True
        if changed:
            db.upsert_run(run, session_id=session_id, user_id=run.user_id)


def load_skills() -> LazySkills:
    return LazySkills(loaders=[LocalSkills(str(d)) for d in SKILL_DIRS if d.is_dir()])


skills = load_skills()
