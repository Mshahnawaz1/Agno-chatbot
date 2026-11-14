"""Skills for the agent: agno's Skills, made lazier.

Sources: skills/<name>/SKILL.md (general) and connector_skills/<name>/SKILL.md
(how to use one connector). Both use agno's LocalSkills loader and SKILL.md format.

Compared with plain agno Skills:
- The system prompt block is a few lines instead of ~500 tokens of boilerplate.
  Up to INLINE_MAX skills are listed by name + description; with more, only
  search_skills finds them.
- search_skills(query) finds skills by keyword.
- get_skill_instructions(name) also honours the SKILL.md `allowed-tools` list:
  those connector tools come back with their schemas (callable now through
  call_tool) and are attached directly to the chat from the next message on.
- Reference and script tools are offered only if some skill has those files.
"""

from pathlib import Path

from agno.run import RunContext
from agno.skills import LocalSkills, Skills
from agno.tools.function import Function

from app.connectors import catalog, tools as connector_tools

ROOT = Path(__file__).resolve().parents[1]
SKILL_DIRS = [ROOT / "skills", ROOT / "connector_skills"]
INLINE_MAX = 8


class LazySkills(Skills):
    def get_system_prompt_snippet(self) -> str:
        skills = self.get_all_skills()
        if not skills:
            return ""
        lines = [
            "<skills>",
            "Skills are playbooks for specific tasks. When a request matches one, call "
            "get_skill_instructions(skill_name) before acting and follow it.",
        ]
        if len(skills) <= INLINE_MAX:
            lines += [f"- {s.name}: {s.description}" for s in skills]
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
        if any(s.references for s in skills):
            tools.append(
                Function(
                    name="get_skill_reference",
                    description="Load a reference document listed by a skill.",
                    entrypoint=self._get_skill_reference,
                )
            )
        if any(s.scripts for s in skills):
            tools.append(
                Function(
                    name="get_skill_script",
                    description="Read (execute=False) or run (execute=True) a script listed by a skill.",
                    entrypoint=self._get_skill_script,
                )
            )
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
            return "No matching skill. Available: " + ", ".join(self.get_skill_names())
        scored.sort(key=lambda x: -x[0])
        return "\n".join(f"{s.name}: {s.description}" for _, s in scored[:5])

    async def get_skill_instructions(self, skill_name: str, run_context: RunContext) -> str:
        """Load a skill's full instructions. Call before doing a task the skill covers.

        Args:
            skill_name: The skill's name.
        """
        skill = self.get_skill(skill_name)
        if skill is None:
            return f"No skill '{skill_name}'. Available: {', '.join(self.get_skill_names())}"
        out = [skill.instructions]
        if skill.references:
            out.append(f"References (get_skill_reference): {', '.join(skill.references)}")
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


def load_skills() -> LazySkills:
    return LazySkills(loaders=[LocalSkills(str(d)) for d in SKILL_DIRS if d.is_dir()])


skills = load_skills()
