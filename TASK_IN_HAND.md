# Task in hand: A2UI research → knowledge base → POC → integration

Goal: understand A2UI properly before building more of it into `dots-in-chat/`.
Each phase ends with a check; the next phase starts only when the check passes.

Outputs:
- Knowledge base: [`a2ui-kb/`](a2ui-kb/) (Markdown notes, one topic per file)
- Proof of concept: [`a2ui-poc/`](a2ui-poc/) (a separate, minimal agent + renderer)

Status legend: `[ ]` to do · `[~]` in progress · `[x]` done

## Phase 1: Fundamentals of A2UI
- [x] 1.1 What A2UI is: the protocol, its message types, surfaces, components, data model,
      data binding, actions, catalogs, versions (v0.8, v0.9, v1.0).
      → `a2ui-kb/01-fundamentals.md`. Finding: v1.0 is current; our app is on v0.9.
- [x] 1.2 How an agent framework pairs with it (Agno, LangGraph, ADK, CopilotKit/AG-UI):
      where the agent writes A2UI, how it is transported, how user actions come back.
      → `a2ui-kb/02-agent-frameworks.md`. Finding: the Python `a2ui-agent-sdk` works around
      any framework that streams text; no Agno adapter exists, but none is needed.
- Check: `a2ui-kb/01-fundamentals.md` and `a2ui-kb/02-agent-frameworks.md` written, with sources.

## Phase 2: How it works end to end
- [x] 2.1 What the agent actually writes (the exact JSON messages) and what is shown for it.
      → `a2ui-kb/03-message-flow.md`, from running the SDK (`experiments/01_message_flow.py`).
- [x] 2.2 The renderer side: how the frontend code (`@a2ui/web_core`, `@a2ui/react`) turns
      messages into components: processor, surface model, catalog, binder, node layer.
- [x] 2.3 The generative elements: built-in (basic/standard) components and functions,
      custom components, theming, validation checks.
      → 2.2 and 2.3 both in `a2ui-kb/04-renderer-internals.md`.
- Check: `a2ui-kb/03-message-flow.md` and `a2ui-kb/04-renderer-internals.md` written; each claim
      traced to a file in node_modules, the spec, or the docs.

## Phase 3: Where templates and skills live
- [x] 3.1 How an agent knows what it can create: catalog documents, catalog instructions,
      prompt/skill generation (e.g. `SkillGenerator` in `@a2ui/agent`), A2A/AG-UI capability
      exchange, or something else.
- [x] 3.2 Find every place templates, examples and skills live (packages, repos, docs) and
      what each contains.
- Check: `a2ui-kb/05-catalogs-and-skills.md` written with a map of where each thing lives;
      copies or summaries of the relevant templates/skills stored under `a2ui-kb/reference/`.
      → `a2ui-kb/05-catalogs-and-skills.md`; copies in `a2ui-kb/reference/upstream/` (pinned),
      measurements in `reference/catalog-knowledge/`. Findings: the catalog drives prompt,
      skills and validation; 40 official example surfaces exist (use them as POC tests);
      upstream `main` uses `@checks` but released SDK 0.11.0 / web_core 0.15.0 use `checks`.

## Phase 4: POC in `a2ui-poc/`
- [x] 4.1 A minimal agent whose only capability is A2UI (no other tools).
- [x] 4.2 A minimal renderer page for its output.
- [x] 4.3 Test end to end against the scenarios the A2UI docs describe (forms, lists/cards,
      choices, dates, validation checks, button actions round-tripped to the agent,
      surface updates/deletes). Record expected vs actual for each.
- Check: `a2ui-poc/RESULTS.md` lists every scenario as pass/fail with its captured output.
      → `a2ui-poc/RESULTS.md`: 43/43 official examples render in the client, 42/43 round-trip
      through the SDK (incremental-dashboard explained), 8/9 live scenarios on
      gemini-3.5-flash-lite (info-card didn't bind data; 9/9 earlier on gemini-3.5-flash).

## Phase 5: Show it in a UI
- [x] 5.1 Run the POC UI and walk through the validated scenarios with the user.
- Check: user signs off. → The user moved straight to integration on 2026-11-16 (approved the
      6.1 plan with changes: v1.0 only, shadcn for every component, a ChatGPT-like theme).

## Phase 6: Integrate into `dots-in-chat/` (only after Phase 5 sign-off)
- [x] 6.1 Plan the integration from what the KB and POC showed. → Plan below; approved
      2026-11-16 with changes: remove v0.9, draw every component with shadcn, theme like ChatGPT,
      otherwise follow the recommendations (no Badge, react-markdown for Text, old v0.9 replies
      shown as a note, results kept here rather than in a new file).
- [x] 6.2 Implement and test (2026-11-16). Not committed. Results in 6.2 below.

### 6.2 What was built, and the test results
Server (`dots-in-chat/app/a2ui/`, replaces `app/a2ui.py`):
- `catalog.py` basic v1.0 catalog pruned to 15 components, SDK generator (Express);
  `prompt.py` judgement + generated snippet (23.7k chars, ~6k tokens per request);
  `turn.py` compiles the streamed reply; `store.py` keeps each turn's parts in the new
  `chat_parts` table and rebuilds `RendererState` from them; `actions.py` validates clicks.
- `routers/chat.py`: SSE `token` (text only), `a2ui`, `a2ui_error`, `a2ui_repair`; one hidden
  repair run (`metadata.a2ui_repair`); `ChatRequest.action` for clicks.
- `routers/sessions.py`: history returns `parts` and `action`, skips repair runs.
- `requirements.txt`: `a2ui-agent-sdk==0.11.0`.
Client (`frontend/src/features/chat/a2ui/`, old `A2uiBlock.tsx`/`parse.ts` removed):
- `protocol.ts`, `feed.ts` (main bundle); `processor.ts`, `Surface.tsx`, `catalog/` (lazy chunk).
- `catalog/`: all 15 components in React with shadcn/ui under the basic catalog id
  (`content.tsx`, `layout.tsx`, `inputs.tsx`, `parts.tsx`, `props.ts`); theme in `a2ui.css`.
- One processor per chat fed by every A2UI message in order; surfaces drawn where created.
- shadcn: `components.json`, `src/components/shadcn/` (10 components), `src/lib/utils.ts`.
- `@a2ui/web_core` and `@a2ui/react` pinned to `0.15.0`.

Results:
| Check | Result |
|---|---|
| `npx tsc -b`, `npx eslint .`, `npm run build` | pass (main 146.8 kB; lazy renderer 569.4 kB / 160.1 kB gzip) |
| Python offline tests (`tests/test_a2ui.py` 8 new + 14 existing) | 22/22 pass |
| 43 official examples through the app's renderer (temporary harness, removed) | 43/43 drawn, no renderer errors; Modal is not in the catalog and is dropped (the server prunes it too) |
| Live e2e in the real UI, gemini-3.5-flash-lite: form, click → answer, reload restores surfaces, weather card (tool + UI), in-place update, delete | 7/7 pass (third run; fixes in between: render-time state update, delete written outside `<a2ui>`) |
| Groq `openai/gpt-oss-120b` alone | first pass compiles; the repair run fails: 8,068 tokens requested, 8,000 TPM limit |

Follow-up (2026-11-16, user's SIP "drag and see the curve" chat):
- Root causes: (1) the basic catalog has no chart and no arithmetic, and the agent wasn't told,
  so it faked a live curve with static text and ASCII; (2) "Blocked by guardrail" was the hidden
  repair run: its prompt was routed to connector tools, and a Typeform tool schema with
  `enum: [..., null]` fails Gemini's schema check; any run error was also labelled a guardrail;
  (3) misleading compiler errors (`root = card`, orphaned components, `surface(...)` before a delete)
  that the repair couldn't fix. Details: `a2ui-kb/05-catalogs-and-skills.md` §8.
- Fixes: chat catalog = basic + official VegaChart, own id `dots-in-chat/chat/v1`, with catalog
  instructions for live Vega-Lite params (`app/a2ui/catalog.py`, `catalogs/vegachart_v1.json`);
  client `catalog/chart.tsx` + `ChartView.tsx` (vega-embed 7.3.0, vega 6.4.0, vega-lite 6.5.0,
  lazy; external data blocked); repair runs get no tool routing; null dropped from tool enums
  (`connectors/tools.py` `model_safe_schema`); run errors other than guardrail checks show as
  errors; guide rules + repair hints for the three compiler errors.
- Checks: 26 offline tests pass; tsc, eslint, build pass; live: the SIP request now draws one
  chart with three sliders, and dragging redraws it in the browser (no agent call).

Open points:
- Groq can't carry this prompt on the free tier: it works only as a last resort for a short turn.
- flash-lite sometimes writes its sentence after the block, so text shows under the card.
- A model error during a run is still shown as "Blocked by guardrail" (existing `run_error` path).
- A local test user `a2ui-e2e@example.com` and its chats were created in `dots-in-chat/data/app.db`.

### 6.1 Integration plan

#### 6.1.0 State found before planning (2026-11-16)
- **The uncommitted shadcn catalog is gone from disk.** `frontend/src/features/chat/a2ui/`
  holds only the committed v0.9 files (`A2uiBlock.tsx`, `a2ui.css`, `index.tsx`, `parse.ts`).
  `genui.tsx`, `Field.tsx`, `aria.ts` are missing, `src/components/shadcn/` is empty,
  `components.json` and the added npm deps (radix slider, checkbox, ...) are gone, and
  `app/a2ui.py` still names the v0.9 basic catalog, not `dots-in-chat/genui@1`. The files were
  never staged, so git has no copy (checked `git fsck --lost-found`, stashes, reflog).
  What caused it is unknown; that session's transcript has no git checkout/clean/reset.
  **Recoverable:** `genui.tsx` was made by one Write plus 4 Edits, and `Field.tsx`/`aria.ts`
  were split out of it by Python scripts. All of that is in the transcript
  `~/.claude/projects/-home-frontier-learning/2c682482-….jsonl`, plus a snapshot of a middle
  version (11.7 kB) in `~/.claude/file-history/2c682482-…/37e9ea5f7101cd12@v3`. The shadcn
  components can be generated again with the CLI (then apply the `cn` import fix).
- **Checks on the tree as it is now** (committed v0.9 basic catalog): `npx tsc -b` exit 0,
  `npx eslint .` exit 0, `npm run build` exit 0 (3.0 s; lazy `A2uiBlock` chunk 487.7 kB,
  135.0 kB gzip). This says nothing about the lost shadcn files.
- Primary model is **`gemini-3.5-flash-lite`**, then `gemini-3.5-flash`, then Groq
  `openai/gpt-oss-120b` (`app/config.py:22`, `app/agent.py` `model_chain`). The POC's 8/9 run
  was on flash-lite, so that is the model chat users get first.
- Python: root `pyproject.toml` has no `agno`/`a2ui` entries; the env has agno 3.1.12, the
  same version the POC ran with. The user's change in `app/agent.py` (pre_hooks commented
  out) is staged and is theirs; the plan doesn't touch it.

#### 6.1.1 Protocol version: v0.9 → v1.0
| Package | Now | Pin |
|---|---|---|
| `a2ui-agent-sdk` (Python) | not installed | `==0.11.0` (`uv add` at the repo root) |
| `@a2ui/web_core` | `^0.15.0` | `0.15.0` exact |
| `@a2ui/react` | `^0.15.0` | `0.15.0` exact |
| `@a2ui/markdown-it` | — | `0.2.2`, **only if** we use its renderer (see below) |

- Imports change to `MessageProcessor`, `basicCatalog` from `@a2ui/web_core/v1_0`.
  `A2uiSurface` stays on `@a2ui/react/v0_9`: react 0.15 has no `v1_0` export, and the POC showed
  it renders v1.0 surfaces (`a2ui-kb/03-message-flow.md` §8, `a2ui-poc/web/src/App.tsx:2-3`).
- Field names follow the **released** packages: `checks`/`accessibility`, not upstream
  `main`'s `@checks`/`@accessibility` (`a2ui-kb/05-catalogs-and-skills.md` §6). Fixtures copied
  from upstream are normalized (`a2ui-poc/scripts/prepare_examples.py`). Check again on every
  package upgrade.
- v1.0 `Text` only has `caption|body`; headings are Markdown in the text (`"### Title"`)
  (`03-message-flow.md` §7). The app already passes Text through its own react-markdown
  `Markdown` via `MarkdownComponentContext` (`A2uiBlock.tsx:12-14`), so headings work without
  adding `@a2ui/markdown-it`. **Recommendation:** keep the app's renderer (one markdown look,
  no raw HTML, no peer-range conflict; markdown-it 0.2.2 needs `--legacy-peer-deps`,
  `a2ui-poc/README.md`). It needs heading styles under `.a2ui-markdown`. To verify in W3: the
  v1.0 surface picks up `MarkdownComponentContext` the same way the v0.9 one does.

#### 6.1.2 Server (`app/a2ui.py`, `app/routers/chat.py`)
Pattern: `a2ui-poc/server/app.py`.
- **Teaching.** `app/a2ui.py` builds one `A2uiGenerator(catalogs=[CatalogConfig(catalog,
  transformers=[pruning])], inference_format_factory=ExpressFormatFactory())` at import and
  exports its `prompt_snippet`. All hand-written catalog text and the v0.9 JSON example go.
  What stays hand-written is the **judgement** part: `A2UI_RULE`, "When to show UI", "after an
  action, act on it", plus the POC's surface rules (`update=true`, new id for a confirmation,
  `deleteSurface`) (`05` §1f, §7).
- **Prompt size is the main cost.** Full basic v1.0 snippet: 23,054 chars (~5.8k tokens), against
  ~1.1k tokens now. Pruned to 7 components: 16,932 chars (`05` §1c). This goes with every
  request. Groq's gpt-oss-120b free tier allows 8k tokens/minute in total (`app/agent.py`
  `model_chain` docstring), so with the full snippet Groq can't serve even one turn. W2 measures
  the pruned size; target the components chat forms use (Card, Column, Row, Text, Button,
  TextField, ChoicePicker, CheckBox, Slider, DateTimeInput, Divider, List, Icon). Optional:
  send the snippet only when the turn may need UI. Not proposed now because it makes the
  "when to show UI" judgement harder.
- **Compile and validate the stream.** In `chat_stream`, each request gets
  `processor = GENERATOR.create_processor(capabilities)`, plus the session's `RendererState`
  and `processor.open_stream(state=state, after_rejected_block="continue")`. Each
  `RunEvent.run_content` chunk goes to `stream.feed()`, and `stream.close()` runs after
  `run_completed`. Parts map to SSE events:

  | SDK part | SSE event (new or changed) | Client |
  |---|---|---|
  | `TextPart` | `token {content}` (same event, now text only) | appends to the turn's markdown |
  | `A2uiPart` (one per finished statement) | `a2ui {message}` (wire v1.0 JSON) | session `MessageProcessor` |
  | `ErrorPart` | `a2ui_error {error}` (logged; shown in dev only) | nothing visible |
  | repair starts | `a2ui_repair {attempt}` | "Fixing the interface…" |

  `session`, `metrics`, `done`, `guardrail_error` and `error` stay as they are. Tool-call events
  don't touch the stream processor.
- **One repair round** (`REPAIR_ATTEMPTS = 1`, `REPAIR_PROMPT` from the POC with the existing
  surfaces listed). Its run uses the same agent and session, so the model sees its own mistake.
  It costs one more model request, which counts against the 20/day free-tier budget. The repair
  run must be **hidden from the history UI**: tag it `metadata={"a2ui_repair": True}` and skip it
  in `GET /sessions/{id}/messages`. Verify that agno stores run metadata (W4).
- **Renderer state across turns and restarts.** The POC keeps `RendererState` in memory
  (`_states`). The app has persistent sessions and restarts, so the compiled wire messages are
  **stored** per session (new `a2ui_messages` table in `app/db.py`: session_id, run_id, seq,
  message JSON). State is rebuilt when needed by replaying them through `RendererState.apply()`
  (`a2ui/utils/renderer_state.py:234`; atomic per call). Rebuilt states stay in a small LRU
  cache. The same table feeds the history endpoint (6.1.3).
- **Actions.** `ChatRequest` gets an optional `action` (a renderer-to-agent message), and
  `message` becomes optional when `action` is set. `RendererToAgentMessageProcessor([catalog],
  on_action, on_error)` validates it before the stream starts, so a bad action is a plain 400.
  The model's turn text is `"User action: " + json + "\nSurfaces that exist now: …"`, as in the
  POC `_turn_input`. The `<a2ui-action>` user-message convention is removed.
- **Fallback.** The app's `FallbackConfig` replaces the POC's 429 retry loop. **Risk to test:**
  if the primary model fails *after* streaming part of a reply and agno falls over, the stream
  processor would see two replies run together. Test by forcing a mid-stream failure; if it
  happens, reset the stream (new `open_stream`) on the fallback callback and tell the client to
  drop the partial turn.

#### 6.1.3 Client (`features/chat/`)
- **Surfaces come from the server, not from parsing text.** `parse.ts` (`parseSegments`,
  `parseMessages`, the JSON sniffing, catalogId/version patching) and the `<a2ui>` text cut-out
  go. A `Turn` gets ordered `parts: ({kind:'text', text} | {kind:'surface', surfaceId})[]`.
  `token` events append text, and a `createSurface` message adds a surface part where it
  arrived. Surfaces render as their statements arrive, which replaces "Building interface…"
  (now: whole block after `</a2ui>`, `03` "Compared with dots-in-chat/ today").
- **One `MessageProcessor` per chat session** (held next to `ChatStreamProvider`, reset on
  chat switch), not one per block. A later turn's `updateDataModel`/`updateComponents` changes
  the surface **where it first appeared**. A `deleteSurface` replaces it with a small "removed"
  note. This matches the server's `RendererState`.
- **Clicks** send the spec envelope `{version:"v1.0", action:{name, surfaceId,
  sourceComponentId, timestamp, context}}` as `ChatRequest.action` (`actionMessage()` in
  `a2ui-poc/web/src/App.tsx:34`). The `ActionMessage` bubble stays, fed from the action instead
  of a parsed string. Surfaces stay `inert` while a run streams, as now.
- **History** (`GET /sessions/{id}/messages`): for each run the server returns the turn's
  text parts and its stored wire messages (and an action turn as `{role:"user", action}`). The
  client replays the messages into the session processor in order, so reloaded surfaces show
  their last state. The model's own history in agno keeps the raw Express text, so it still
  sees what it wrote. Values typed into a form but never submitted are lost on reload. That is
  accepted.
- **Old v0.9 sessions** (JSON inside `<a2ui>` in stored content): **recommendation:** show the
  block as a static "interactive part from an earlier version" note and stop rendering v0.9.
  The other choice is to keep the v0.9 path read-only, which means two processors and two
  catalogs in the bundle.
- The lazy-loaded renderer chunk stays lazy. It loads on the first `a2ui` event or history
  surface.

#### 6.1.4 Catalog
- What A2UI separates: a **catalog fixes component names and props (the schema)**. How they
  look is the renderer's business. Drawing the basic components with shadcn **doesn't need a
  custom catalog**. Only new components such as `Badge` do (`05` §1a, `04-renderer-internals.md`).
- **Recommendation, in two steps:**
  1. Integrate on the **basic v1.0 catalog** (`BasicCatalog(ProtocolVersion.V1_0)`, id
     `https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json`). This is what the POC
     validated (43 examples, 9 scenarios). The app's look comes from the `--a2ui-*` variables in
     `a2ui.css`.
  2. Then bring the shadcn look back by **registering shadcn implementations for the basic
     components under the basic catalog id**, rebuilt from the transcript and ported from v0.9
     to v1.0 APIs. No prompt or server change is needed. To verify in W7: web_core 0.15 lets a
     catalog keep the basic id while swapping implementations. If it doesn't, use a custom id
     whose catalog document is the basic one.
- **Badge:** drop it unless wanted. If kept, it needs a custom catalog *document* (basic +
  Badge, own `$id`) loaded by the SDK through a CatalogProvider, so prompt, server validation
  and client all come from one file. Add a CI check that fails when the generated snippet
  differs from what's committed (travel's `build_skills.py --check`, `05` §5).

#### 6.1.5 Models and fallback
- Run the same scenario set on **each model in the chain**: `gemini-3.5-flash-lite`
  (primary), `gemini-3.5-flash`, Groq `openai/gpt-oss-120b`. Groq has never been tried with
  Express and is the one most likely to break on prompt size (6.1.2).
- POC evidence: flash 9/9, flash-lite 8/9, and flash-lite hard-coded values instead of binding
  the data model (`a2ui-poc/RESULTS.md` Findings, `info-card`). Options if the app run agrees:
  (a) put `gemini-3.5-flash` first, (b) add one official binding example as a few-shot
  (+~1k chars, `05` §1c), (c) accept it, since unbound display values still render. Decide
  from the numbers.
- Budget: a full live run is ~12 requests (`a2ui-poc/README.md`). Free tier is 20 per model per
  day, so one model per day. Pace 13 s between requests.

#### 6.1.6 Tests (the POC's approach, pointed at the app)
| Layer | What | From |
|---|---|---|
| Server, no model | Official examples validated and round-tripped through the app's own generator/catalog (pruned) | `a2ui-poc/tests/official_examples.py` |
| Server, no model | Stream mapping: recorded model outputs (good, rejected, repaired) → expected SSE events; history replay rebuilds `RendererState` | new pytest, fixtures from `a2ui-kb/reference/message-flow/` |
| Client, no model | Official examples rendered by the app's renderer (dev-only gallery route), no errors, a button press emits a valid action | `a2ui-poc/tests/run_examples.mjs` |
| End to end, live | `scenarios.json` through the real app UI: logged-in test user, Playwright; expected messages, fill + submit, action reaches agent | `a2ui-poc/tests/run_scenarios.mjs` |
| App-only scenarios | form inside a tool flow (weather city picker); reload restores surfaces; update after reload; action after reload; repair hidden from history; old v0.9 session shows the note | new |
| Frontend checks | `npx tsc -b`, `npx eslint .`, `npm run build` | CLAUDE.md |
Results go into `dots-in-chat/A2UI_RESULTS.md` (or kept local like the POC; your call).

#### 6.1.7 Risks, effort, order of work
Risks:
1. **Prompt size**: ~4–6k extra tokens per request. Slower and dearer on Gemini; may rule out Groq.
2. **Mid-stream fallback** corrupting the compiled stream (6.1.2).
3. **flash-lite binding quality** in the primary slot.
4. **Lost shadcn work**: rebuilding it from the transcript isn't guaranteed to match the
   browser-tested version.
5. **Packages ahead/behind spec** (`checks` vs `@checks`): pinned now, can break on upgrade.
6. **History migration**: old v0.9 replies stop being interactive.
7. **Free-tier quota** limits live testing to one model per day.

Order (each step ends green on tsc/eslint/build and its tests):
| Step | Work | Effort |
|---|---|---|
| W1 | Pin packages; `uv add a2ui-agent-sdk==0.11.0`; offline test that the app catalog's snippet builds | 0.5 h |
| W2 | `app/a2ui.py`: generator + pruning + judgement prompt; measure prompt size; offline example round-trip test | 1–2 h |
| W3 | `chat.py`: stream through `open_stream`, new SSE events, `a2ui_messages` table, state rebuild; stream-mapping tests | 3–4 h |
| W4 | Repair round, hidden from history; actions via `ChatRequest.action` + `RendererToAgentMessageProcessor` | 2 h |
| W5 | Client: session processor, `parts`, progressive surfaces, spec actions, history replay, v0.9 note; remove `parse.ts` text path | 4–5 h |
| W6 | Live scenarios on flash-lite, then flash, then Groq (one per day); decide model order | 3 days × ~1 h |
| W7 | Shadcn look on the basic catalog (rebuild from transcript, port to v1.0); Badge only if wanted | 3–4 h |
| W8 | Mid-stream fallback test and fix | 1–2 h |
| W9 | Review (`/code-review`), results file, update KB/memory; commit only when asked | 1 h |
Total about 2–3 working days of build, plus the live-test days.

#### 6.1.8 Decisions needed from the user
1. Approve the plan (and Phase 5 sign-off, still open).
2. Catalog: basic v1.0 first, then the shadcn look on it (recommended), or rebuild the custom
   `genui` catalog first?
3. Keep Badge (needs a custom catalog document) or drop it?
4. Old v0.9 sessions: static note (recommended) or keep a read-only v0.9 renderer?
5. Text markdown: keep the app's react-markdown (recommended) or add `@a2ui/markdown-it` 0.2.2?
6. Results file in git (`dots-in-chat/A2UI_RESULTS.md`) or local only?

## Phase 7: Chat blocks from the Figma design (done 2026-11-16, not committed)
Source: "Interactive & generative chat blocks — proposal for the UI team" (Figma export
`C:\Users\shahn\Downloads\Pritam's Proposal.png`). Only the interactive chat components; no
changes to `a2ui-poc/`.
- [x] 7.1 Foundation: glass theme tokens + Poppins (`a2ui.css`), block kit
  (`frontend/src/features/chat/a2ui/blocks/kit.tsx`), hooks (`hooks.ts`: live state mirrored to the
  data model at `/blocks/<id>`, block events), server loads `app/a2ui/catalogs/blocks/*.json` into
  the catalog and prompt (`catalog.py`), `say` action for Suggestions (`actions.py`, shown as a
  plain user message in `Message.tsx`), dev-only gallery `/dev/blocks` with an "Agent update" button.
- [x] 7.2 GrowthCalculator (SIP) + Suggestions (main session)
- [x] 7.3 BudgetSplit (draggable ring), QuadraticExplorer (Sonnet subagent)
- [x] 7.4 ChartSwitcher (bar/line/area/pie/donut, greys out dishonest styles), ChartGallery (Sonnet)
- [x] 7.5 OrderReview (hold 1.5 s to pay), ReminderPicker, RankList (drag + keyboard) (Sonnet)
- [x] 7.6 MessageApproval (8 s undo before sending), DraftDiff, BatchSend (Haiku)
- [x] 7.7 Review and tests:
  - offline server: `PYTHONPATH=. python -m unittest tests.test_blocks tests.test_a2ui` → 17/17
    (every guide's Express example compiles; update in place; `say` prompt)
  - browser, no model: `node e2e/blocks.mjs <vite url>` → 15/15 (zod ↔ JSON schema sync, all
    samples render with no console errors, each block's maths/events, agent update, 360 px)
  - live, gemini-3.5-flash-lite through the real UI: `node e2e/live_blocks.mjs <vite url> <out>`
    → 5/5 (SIP, budget, message, weekly spending, quadratic each answered with the right block);
    SIP: dragged years to 20 in the browser, tapped a suggestion, the agent updated the same card
    keeping 20 years. Found and fixed: new suggestions stayed disabled after an agent update.
  - tsc, eslint, build pass. Main bundle unchanged; lazy Surface chunk +17 kB gzip.
- Open: flash-lite still sometimes writes its sentence after the block; prompt is now 39k chars
  (blocks add ~7k); an in-place update redraws the card in the earlier message, so the new reply
  can be text only. A test user `blocks-e2e-…@example.com` was created in `data/app.db`.

## Phase 8: Input token cost and "This interface was removed" (done 2026-11-16, not committed)
- [x] 8.1 Root cause of input tokens, from `data/agno.db` runs + Gemini count_tokens:
  - system prompt 11,012 tokens per model call, 10,475 of it A2UI (component signatures 4,573,
    catalog instructions 2,643, functions 1,345, grammar 969, our guide 701); tools 546; history
    0-3.5k. Resent on every model call: tool steps (1-7 per run), repair runs.
  - agno's `<additional_information>` (current time, to the microsecond) sat at char ~500, before
    the A2UI block (`additional_context`), so the prompt differed after ~130 tokens on every
    request: no cross-turn cache hits in any stored run (only inside tool loops).
  - `search_past_sessions` listed 20 sessions x 3 runs: 8k chars on average per call.
- [x] 8.2 Fixes: A2UI block moved into `instructions` (before the time): the prefix shared by
  two requests went from ~130 tokens to 9,897 of 10,225; the SDK's `weight` note said once instead of 15 times
  (`catalog.py` `_compact`, ~790 tokens); `num_past_sessions_to_search=8`.
  Raw test: 3 identical flash-lite requests got no implicit cache hit, so caching is best-effort
  on this key; the prompt size is what reliably counts.
- [x] 8.3 "This interface was removed": all 7 stored cases were model `deleteSurface`s of an
  earlier card; 6 of 7 came while it showed a new card (the guide told it to delete on layout
  changes), 1 was asked for. Fixes: guide says keep earlier surfaces, delete only on request;
  server holds deletes to the end of the turn and drops those in a turn that creates a surface
  (`store.keep_earlier_surfaces`, `A2uiTurn.finish`), also on read, so old chats get their cards
  back. Edge: "remove X and show Y" in one turn keeps X.
- Checks: 34 offline tests pass (3 new); live flash-lite: histogram then "make this into a pie
  chart" → updated in place, no delete, nothing rejected. Test user `token-audit@example.com`
  and `token-audit*` sessions were created in `data/`.
- Open: function signatures (1,345 tokens): only `required` and `numeric` were used in 61
  stored A2UI replies; dropping the rest would save ~1k tokens but removes features.

## Phase 9: A2UI as a lazily loaded skill (done 2026-11-16, not committed)
Rule from the user: nothing goes straight into the system prompt; it is a skill loaded when needed.
- [x] 9.1 Research (three Sonnet subagents): Agent Skills spec + Anthropic docs (3 levels:
  metadata always, SKILL.md < 5k tokens on trigger, references/scripts on demand; validator loop),
  Hermes agent (`skill_view(name, file_path)`, repeat-load stubs, date-only timestamp, old tool
  output cleared), agno 3.1.12 source (only references/ + scripts/ scanned; `allowed_tools` unused;
  scripts run without cap; retry-with-errors only through a tool, not post_hooks/retries).
- [x] 9.2 Built:
  - `skills/a2ui/`: SKILL.md (judgement, workflow, rules, block index; `metadata.preload` =
    grammar, components, form template), `references/` generated from the catalog
    (`app/a2ui/skill_build.py`, `--check` in tests), `templates/` (form, block-card, update),
    `scripts/check.py` (compiles a block against the chat's real surfaces, fix hints).
  - `app/skills.py`: `get_skill_instructions(name, paths=[...])` returns SKILL.md + preload +
    asked files in one call, repeats in a run are stubs; `get_skill_script` runs only (app Python,
    session id, 30 s, 4k chars); `stub_skill_loads` replaces loaded skill text in stored runs
    (`agno_runs` rows) after each turn; skill search falls back to every description.
  - `app/a2ui/turn.py`: `surface("<existing id>")` is turned into `update=true` while streaming
    (no repair run); hints for unknown components (lists them) and string children.
  - System prompt: A2UI block and A2UI_RULE removed; 11,012 → 600 tokens.
- Found live: agno silently drops a tool argument named `files` (framework-injected media
  parameter); renamed to `paths`, with a test against agno's reserved names.
- Live (flash-lite, one chat): capital of France 1,320 in; "plan a weekend trip" 16,069 (load,
  check OK first try, form); SIP 10k/month 25,534 (load + block-growth, check OK, GrowthCalculator);
  "make it 20 years" 4,446 (update in place). Before: ~11.6k+ for every turn, so plain turns are
  ~9x cheaper and UI turns ~1.3-2x dearer (2-3 extra round trips).
- Checks: 42 offline tests pass; references up to date; app imports.
- Open: the check call costs one round trip per UI turn; listing skill file names in the index
  (~80 tokens/turn) would let block turns load in one call instead of two.

## Phase 10: Fewer model calls per UI turn, following the A2UI docs (done 2026-11-17, not committed)
Source: https://a2ui.org/guides/agent-integration/ (+ /concepts/inference-formats/, /concepts/sdks/).
The docs' method is prompt-based Express through the SDK (what we run); tool-call emission is
only named for ADK/CopilotKit with no schema, so a custom `show_block` tool was dropped.
- [x] 10.1 Bench: `dots-in-chat/scripts/bench_a2ui.py` (real /chat/stream, fresh chat per rep).
  Free tier is 15 requests/min on flash-lite, so it pauses between turns.
- [x] 10.2 Changes: no `search_skills` tool when the index lists all skills (`app/skills.py`);
  index lists file names; `paths` is a required argument, so the first call names the files;
  `metadata.default_paths` (forms: components + form template) apply only when no paths are given,
  a block turn skips the form components (turn-type pruning); `metadata.pairs` brings
  block-card.md with any block file; the model no longer gets `get_skill_script` (check.py stays
  as a dev tool): the server validates, and a rejected block gets the errors in a repair run
  (`REPAIR_ATTEMPTS` 1 -> 2, the docs' maxRetries); stronger trigger text in the skill description.
- [x] 10.3 Cleanup and the docs' retry prompt: removed `get_skill_script`, `skills/a2ui/scripts/check.py`
  and `A2uiTurn.upgraded` (nothing in the app used them); the repair prompt now quotes the rejected
  reply and the validation error, like the docs' `generate_validated_turn`.
- Results, final code, reply-run input tokens / skill loads (baseline -> after; flash-lite free tier,
  n = 3-6, repair runs not in the token column, none occurred):
  budget 23.5k/4 -> 5.5k/1; SIP 22.8k/3.5 -> 5.7k/1; chart 25.0k/4 -> 8.5k/1.3; trip 16.3k/3 -> 8.3k/1.3;
  plain 1.3k -> 1.3k. UI shown in every UI turn; one turn of 18 failed on a Gemini 429.
  Seconds are noisy (provider latency 3-20 s): budget 12 -> 9.6, SIP 10 -> 9, chart 18 -> 14.
- [x] 10.4 Skill content (2026-11-17): templates folded away (block-card example and update examples
  into SKILL.md, form template -> `references/form.md`; no `templates/` dir, `pairs` now brings
  `references/chart-choice.md` with any chart file). New `references/chart-choice.md`: data rules (no
  invented numbers), request -> chart type table, ChartSwitcher flags (`ordered` defaults to true, so
  categories got line/area unless `ordered=false` is passed), Vega-Lite examples (bar, line, donut,
  stacked, scatter, histogram, all compiled with the frontend's vega-lite). SKILL.md opens with a
  request -> block -> files table and "when NOT to ask" (details given: no form).
  Live, flash-lite: category bar -> ChartSwitcher bar, ordered=false (2/2); time series -> line,
  ordered=true (2/2); scatter -> VegaChart point (2/2); pie of temperatures -> the block greys the
  pie, but the model's sentence still said "pie chart" (rule added to the guide, not re-measured).
- Open: sample sizes are small; the benchmark and tests are kept local, not committed.

## Phase 11: Why charts did not show, and a more robust A2UI pipeline (done 2026-11-17, not committed)
Report: "monthly tracker" said "here is your tracker" and showed nothing; radar charts failed.
- [x] 11.1 Causes, from the stored runs (`agno.db`) replayed through the compiler:
  1. The model wrote `BudgetSplit(..., title: "x")`; call arguments use `=`, a colon is only for map keys. The
     error text ("extraneous input ':'") gave no hint, so 3 repair runs repeated it.
  2. Streaming compiled the `root = Column([budget, next])` line first, then failed on `budget`: the client
     got a surface whose children were never defined (an empty card) and the id counted as existing, so the
     repairs wrongly used `update=true`.
  3. Radar: the model wrote an invalid Vega-Lite spec (`"coordinates": "polar"`, a `closed` mark option); the
     browser drew nothing; the skill had no radar/gauge/heatmap/waterfall recipe.
  4. After the repairs failed, the reply's own "here is your chart" stayed alone.
- [x] 11.2 Fixes (`app/a2ui/turn.py`, `vegacheck.py`, `routers/chat.py`):
  - a block is all-or-nothing: compiled messages wait until the block ends and a failing block drops its own;
    the state is rebuilt without its half-built surface.
  - `fix_named_args` / `A2uiTurn.autofix`: `name: value` call arguments are rewritten to `name=value` and the
    block recompiled with no model call; a fix hint for the error otherwise.
  - VegaChart specs are checked against the official Vega-Lite JSON schema (vendored
    `catalogs/vega-lite-schema.json`, from the frontend's vega-lite 6.5.0) before they are shown; the error
    names the path, and a chart repair prompt carries the working recipes.
  - `give_up`: "I couldn't draw that card" is added when the repairs fail.
  - `ChartView` tells vega-embed to use Vega-Lite unless the spec has `marks`.
- [x] 11.3 Skill: `references/chart-choice.md` has verified recipes (bar, line, donut, stacked, scatter,
  histogram, radar, gauge, heatmap, waterfall, area); SKILL.md states the `=` rule and sends radar/gauge/...
  to VegaChart recipes.
- [x] 11.4 Tests (the bench, e2e scripts and dev pages used for these checks were deleted afterwards, not committed): dev pages `/dev/chart` and `/dev/surface`; `frontend/e2e/charts.mjs` (every recipe draws),
  `frontend/e2e/pipeline.mjs` (every skill example: server compile -> real renderer, 26/26; `WIRE_JSON` renders a
  model's actual output), `blocks.mjs` 15/15; 55 offline tests; tsc, eslint, build pass. Found while testing: a
  gauge recipe that "drew" a full ring (checked by eye, screenshots), and `{...}` in a hint breaking `.format`.
- Live (flash-lite): tracker 2/2 BudgetSplit; radar 6/6; heatmap 2/2; waterfall 5/5 (one 503); gauge: one run
  ended with the honest "couldn't draw" note before recipes were added to the repair prompt, then 4/4 (1-2
  repairs on two of them).
- Open: a spec that is schema-valid but draws wrongly is not caught; samples are small.

## Phase 12: full public A2UI (branch feat/a2ui-full)
Goal: every public A2UI v1.0 capability in dots-in-chat, with scenario-based iterative tests (write a scenario, run it, fix, rerun; record results here).
Audit (2026-11-17, partial): done = the 4 surface messages, basic catalog, VegaChart, 12 blocks, `action`.
Missing = renderer `error` -> agent, `sendDataModel`, capabilities handshake, function RPC, mixed catalogs.
Unknown = inline createSurface components/data, progressive render, @checks ValidationResult, @accessibility, templates/@index.
Not in scope: A2A / AG-UI / MCP transports (Agno SSE does this job), CopilotKit.
Tracks (parallel, one worktree each):
- [ ] 12.A Audit of the Unknown rows by running them + replay all 43 official examples through the app's renderer and server compiler (tests + results table).
- [ ] 12.B Feedback channel: renderer `error` -> agent (+ repair), `sendDataModel`, capabilities handshake, then function RPC (both directions, allowedCallers, requiresUserActivation).
- [ ] 12.C Catalogs: mixed catalogs (per-component catalogId), register upstream catalogs, macros, blueprints; skills + check scripts.
- [x] 12.D Progressive rendering while the model streams (turn.py / feed). Measured first: NOT progressive (a whole
  block's messages were held until `</a2ui>`). Now a block that creates a new surface streams statement by statement
  (the SDK also re-sends a component as it grows); if the block then fails, `a2ui_retract` makes the client drop the
  surface and the stored parts never hold it. Blocks that change an existing surface stay all-or-nothing (cannot be
  undone client-side). Tests: `tests/test_a2ui_progressive.py` (chunk sizes 1..5000, invalid mid-stream, repair and
  autofix after partial render, several surfaces, cut stream).
- [ ] 12.E Merge, full scenario suite, tsc/eslint/build, update a2ui-kb.
Results: (fill in per track)

## Notes
- `dots-in-chat/` now runs A2UI v1.0 through the SDK (6.2); the v0.9 integration (b96aed0) and
  the lost shadcn catalog are replaced.
