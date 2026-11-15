# Frontend redesign — task list

See `design.md` for the spec. Each agent works in its own git worktree on its own branch, and the
orchestrator merges the branches into `feat/UI`.

Model choice: **Opus** for the trickiest logic (streaming chat state), **Sonnet** for standard UI and
scaffolding, **Haiku** for small mechanical backend edits.

## Phase 1 — foundation (parallel)

### T1 · Scaffold + shared foundation — Sonnet — branch `ui/foundation`
- [ ] Delete the old vanilla files in `frontend/`; create a Vite React-TS project there
- [ ] Deps: react-router, @tanstack/react-query, tailwindcss + @tailwindcss/vite, radix (dialog, switch,
      dropdown-menu, tooltip), lucide-react, clsx, react-markdown, remark-gfm, fontsource Outfit/Inter/JetBrains Mono
- [ ] `vite.config.ts`: tailwind plugin, dev proxy for the API prefixes
- [ ] `styles/index.css`: `@theme` tokens, base styles, `.bg-glow`, `.bg-grid`, reduced-motion handling
- [ ] `lib/`: `types.ts`, `token.ts`, `api.ts`, `sse.ts`, `format.ts` (session date grouping)
- [ ] `auth/`: `AuthProvider` (+ `useAuth`), `RequireAuth`
- [ ] `components/ui/`: Button (primary/pill/secondary/ghost/danger), IconButton, Input, Field, Dialog,
      Switch, Spinner, Badge, Tooltip, Logo
- [ ] `App.tsx` route table with **stub** pages in each feature folder (LoginPage, SignupPage, AppShell,
      ChatPage, ConnectorsPage) so later agents only edit their own folder
- [ ] `npm run build` and `npm run lint` pass; commit

### T2 · Backend SPA support — Haiku — branch `ui/backend`
- [ ] `app/main.py`: serve `frontend/dist` with an SPA fallback (skip API prefixes); warn if dist is missing
- [ ] `app/routers/connectors.py`: callback redirects to `/settings/connectors?connected=…` / `?connector_error=…`
- [ ] `.gitignore`: `node_modules/`, `frontend/dist/`
- [ ] `python -c "import app.main"` succeeds; commit

## Phase 2 — features (parallel, after T1 is merged)

### T3 · Auth pages — Sonnet — branch `ui/auth`
- [ ] `AuthLayout` (glow + grid + floating pill nav), `LoginPage`, `SignupPage`
- [ ] Password show/hide, client-side validation, error banner, `?expired=1` and `?next=` handling
- [ ] Pill CTA with busy state; build + lint pass; commit

### T4 · App shell + chat — Opus — branch `ui/chat`
- [ ] `AppShell`, `Sidebar` (new chat, search, grouped sessions, connectors row, user menu), `TopBar`,
      mobile drawer
- [ ] `ChatPage`: empty state with suggestions, history load, message list, auto-scroll + jump button
- [ ] `useChatStream` reducer: SSE events, abort, new-chat → `/c/:id` without remount, invalidate sessions
- [ ] `Markdown` + `CodeBlock` (copy), `Message` with action row (copy, metrics), `MetricsPanel`
- [ ] `Composer`: autosize, Enter/Shift+Enter/IME, send ↔ stop, 4000-char limit
- [ ] Build + lint pass; commit

### T5 · Connectors page — Sonnet — branch `ui/connectors`
- [ ] `connectorMeta.ts`, `queries.ts` (query + mutations)
- [ ] `ConnectorsPage`: header, search, All/Connected tabs, 2-column grid, OAuth redirect banner
- [ ] `ConnectorCard` modeled on Claude's directory (icon tile, name, description, by X, +/✓/power button)
- [ ] `ConnectorDetailDialog` (switch, details, skill link, disconnect with inline confirm),
      `ApiKeyDialog`, `SkillDialog` (shares Markdown with chat: a minimal local renderer until T4 merges,
      then switch to the shared one)
- [ ] Build + lint pass; commit

## Phase 3 — integrate & verify (orchestrator)
- [ ] Merge T3, T4, T5 into `feat/UI`; resolve conflicts (likely only `App.tsx` / shared Markdown)
- [ ] `npm ci && npm run build && npm run lint` in `frontend/`
- [ ] Run FastAPI against the built `dist`; smoke test: `/login` page renders, SPA deep links
      (`/c/x`, `/settings/connectors`) serve index.html, and the API still returns JSON
- [ ] Final review pass; tick boxes here
