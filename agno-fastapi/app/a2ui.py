"""A2UI (https://a2ui.org) instructions for the agent.

The agent writes A2UI v0.9 messages as JSON inside <a2ui>...</a2ui> in its
reply; the frontend (features/chat/a2ui) cuts those blocks out of the text and
renders them with @a2ui/react. A button click comes back as a normal user
message wrapped in <a2ui-action>...</a2ui-action>.

Sent with every request (~1.1k tokens), so keep it tight.
"""

CATALOG_ID = "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json"

# One line for the top of the system prompt: models weigh early instructions most.
A2UI_RULE = (
    "Whenever your reply needs the user to choose, pick, confirm or fill in details, show an "
    "interactive form (see <interactive_ui>) instead of listing questions or options as text."
)

A2UI_INSTRUCTIONS = f"""<interactive_ui>
The chat renders interactive UI written in A2UI v0.9. The user clicks instead of typing.

## When to show UI (follow strictly)
You MUST use a form whenever your reply would otherwise:
- ask the user a question that has a known set of answers (preferences, type, style, category, yes/no)
- ask for two or more details (e.g. destination, dates, budget, group size)
- offer options, recommendations or plans to pick from
- need confirmation before you create, change, send or delete something
- need a date, time, number, amount or rating from the user
Never write those questions or options as a bulleted/numbered list. Put ALL of them in ONE form with one
submit button, then stop and wait for the answer.
Do NOT use UI for: plain answers, explanations, code, or a single open question with no natural options.

## How to write it
Reply with one short sentence, then the block. Don't repeat the form's questions or options in text.
Write a JSON array of three messages between <a2ui> and </a2ui> (each tag on its own line, no code fence):
1. createSurface {{"surfaceId":"<unique_snake_case>","catalogId":"{CATALOG_ID}"}}
2. updateComponents: a flat list of components; exactly one has id "root"; children referenced by id
3. updateDataModel with path "/" and sensible default values for every input
Every message has "version":"v0.9".

Pick the input that fits:
- one choice from options -> ChoicePicker variant mutuallyExclusive (displayStyle chips if <= 6 short options)
- several choices -> ChoicePicker variant multipleSelection
- date or time -> DateTimeInput (enableDate / enableTime)
- number or amount -> TextField variant number, or Slider for a bounded range
- yes/no toggle -> CheckBox
- free text -> TextField (longText for notes; make notes optional)

Components (* = required):
- Text: text*, variant h1|h2|h3|h4|h5|caption|body (no "#" in text when a variant is set)
- Column, Row: children* (ids), justify start|center|end|spaceBetween, align start|center|end|stretch
- Card: child* (one id); List: children*, direction vertical|horizontal; Tabs: tabs* [{{"title","child"}}]; Divider
- Image: url*, variant icon|avatar|smallFeature|mediumFeature|largeFeature|header
- Icon: name* (add, check, close, delete, edit, event, calendarToday, info, warning, search, star, locationOn, person, send)
- Button: child* (id of a Text), action*, variant primary|default|borderless
- TextField: label*, value, variant shortText|longText|number
- ChoicePicker: options* [{{"label","value"}}], value* (string array, also for one choice), variant, displayStyle checkbox|chips, label
- CheckBox: label*, value* (boolean); Slider: value*, max*, min, label; DateTimeInput: value* (ISO 8601), enableDate, enableTime, label
Bind every input: "value":{{"path":"/form/<field>"}}. The button's action must carry every field:
"action":{{"event":{{"name":"<verb_noun>","context":{{"<field>":{{"path":"/form/<field>"}}}}}}}}

## Example
User: "Help me plan a weekend trip near Pune"
Let's tailor it to you:
<a2ui>
[{{"version":"v0.9","createSurface":{{"surfaceId":"trip_prefs","catalogId":"{CATALOG_ID}"}}}},
{{"version":"v0.9","updateComponents":{{"surfaceId":"trip_prefs","components":[
{{"id":"root","component":"Card","child":"col"}},
{{"id":"col","component":"Column","align":"stretch","children":["title","vibe","days","travel","group","start","go"]}},
{{"id":"title","component":"Text","text":"Weekend trip preferences","variant":"h3"}},
{{"id":"vibe","component":"ChoicePicker","label":"Vibe","variant":"multipleSelection","displayStyle":"chips","options":[{{"label":"Hills & nature","value":"nature"}},{{"label":"Heritage","value":"heritage"}},{{"label":"Beach","value":"beach"}},{{"label":"Relax at a resort","value":"resort"}}],"value":{{"path":"/form/vibe"}}}},
{{"id":"days","component":"ChoicePicker","label":"Duration","variant":"mutuallyExclusive","displayStyle":"chips","options":[{{"label":"1 day","value":"1"}},{{"label":"2 days / 1 night","value":"2"}},{{"label":"3 days","value":"3"}}],"value":{{"path":"/form/days"}}}},
{{"id":"travel","component":"ChoicePicker","label":"Travel by","variant":"mutuallyExclusive","displayStyle":"chips","options":[{{"label":"Self-drive","value":"car"}},{{"label":"Bus","value":"bus"}},{{"label":"Train","value":"train"}}],"value":{{"path":"/form/travel"}}}},
{{"id":"group","component":"ChoicePicker","label":"Who's going","variant":"mutuallyExclusive","displayStyle":"chips","options":[{{"label":"Solo","value":"solo"}},{{"label":"Couple","value":"couple"}},{{"label":"Family","value":"family"}},{{"label":"Friends","value":"friends"}}],"value":{{"path":"/form/group"}}}},
{{"id":"start","component":"DateTimeInput","label":"Start date","enableDate":true,"value":{{"path":"/form/start"}}}},
{{"id":"go_text","component":"Text","text":"Plan my trip"}},
{{"id":"go","component":"Button","child":"go_text","variant":"primary","action":{{"event":{{"name":"plan_trip","context":{{"vibe":{{"path":"/form/vibe"}},"days":{{"path":"/form/days"}},"travel":{{"path":"/form/travel"}},"group":{{"path":"/form/group"}},"start":{{"path":"/form/start"}}}}}}}}}}
]}}}},
{{"version":"v0.9","updateDataModel":{{"surfaceId":"trip_prefs","path":"/","value":{{"form":{{"vibe":["nature"],"days":["2"],"travel":["car"],"group":["couple"],"start":"<next Saturday, ISO date>"}}}}}}}}]
</a2ui>

## After a click
You then get a user message <a2ui-action>{{"name":"...","surfaceId":"...","context":{{...}}}}</a2ui-action>.
That is the user's answer: act on it right away (answer, plan, or call the tool) and don't show the same form again.
If something essential is still missing, ask for only that, again with a form.
</interactive_ui>"""
