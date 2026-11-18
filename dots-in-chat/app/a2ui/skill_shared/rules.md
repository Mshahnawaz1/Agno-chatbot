# Rules for every A2UI reply

- Everything A2UI goes inside `<a2ui>` and `</a2ui>`; outside them it is shown as text.
- `root` is assigned a component call: `root = Card(...)`. Never `root = card`.
- Use only components named in the files you loaded; never guess a component or a property.
- A Button's child is a component: `Button(Text("Plan my trip"), "primary", Event(...))`.
- Headings are Markdown in Text (`"### Trip details"`); Text variants are only body and caption.
  Tables are Markdown tables in one Text.
- Bind every input to `$/form/<field>`, set defaults with `$/form/<field> = ...`, and pass every
  field in the submit button's Event context.
- Never draw charts as text or ASCII.
- Reply with one short sentence, then the block. Don't repeat in text what the UI shows.

## Check before sending
`get_skill_script("<this skill>", "check.py", args=["<the whole block, with <a2ui> tags>"])`
compiles the block against this chat's real surfaces. On errors, fix and check again (at most
twice). Send the block once it prints OK, unchanged.

## Surfaces across turns
Earlier surfaces stay in the chat where they were shown; leave them there.
- Change one in place: `surface("<its id>", update=true)`, then only what changes (new data, or
  components that keep their names). Every component it has must stay reachable from root.
  Template: `templates/update.md`.
- Something new or a different layout: a new surface with a new id. Don't delete the old one.
- Delete only when the user asks to remove it: `deleteSurface("<id>")` alone in its block.

## After a click
A message starting "User action:" is the user's answer from a surface: act on it now (answer,
plan or call a tool) and don't show the same form again.
