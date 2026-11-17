# Frontend redesign — React + TypeScript

Replaces the vanilla-JS app in `frontend/` with a Vite + React + TypeScript SPA.
Same backend API, same features, cleaner structure and a high-contrast dark UI.

## Decisions

| Topic | Choice |
|---|---|
| Location | `frontend/` becomes the Vite project; old vanilla files are deleted. FastAPI serves `frontend/dist`. |
| Stack | Vite, React 19, TypeScript (strict), React Router 7, TanStack Query 5 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), tokens as CSS variables in `@theme` |
| UI primitives | Radix (Dialog, Switch, DropdownMenu, Tooltip), `lucide-react` icons, `clsx` |
| Markdown | `react-markdown` + `remark-gfm` (no raw HTML, so no DOMPurify) |
| Fonts | Self-hosted via `@fontsource-variable/outfit` (headings) and `@fontsource-variable/inter` (body); `JetBrains Mono` for code |
| Theme | Dark only, high contrast |
| Routing | Real paths, SPA fallback in FastAPI |

## Routes

| Path | Page | Auth |
|---|---|---|
| `/login` | Log in | public (redirects to `/` if logged in) |
| `/signup` | Sign up | public |
| `/` | New chat (empty state) | protected |
| `/c/:sessionId` | Existing chat | protected |
| `/settings/connectors` | Connectors | protected |
| `*` | Redirect to `/` | — |

The API owns `/auth`, `/users`, `/sessions`, `/chat`, `/connectors`, `/health`, so no SPA path may start
with those. That is why connectors live at `/settings/connectors`.

## Backend changes (small)

1. `app/main.py`: serve `frontend/dist` with an SPA fallback. A `StaticFiles` subclass returns
   `index.html` for any 404 whose path does not start with an API prefix. If `dist/` is missing,
   log a hint (`cd frontend && npm run build`) instead of crashing.
2. `app/routers/connectors.py` callback: redirect to `/settings/connectors?connected=<id>` and
   `/settings/connectors?connector_error=<id>` (was `/?…#connectors`).
3. `.gitignore`: `node_modules/`, `frontend/dist/`.

## Dev workflow

- `uvicorn app.main:app --reload` on :8000
- `cd frontend && npm run dev` on :5173. The Vite proxy forwards `/auth /users /sessions /chat /connectors /health`
  to :8000 (SSE works through it).
- `npm run build` outputs `frontend/dist`, which FastAPI serves in production.

## Folder structure

```
frontend/
  index.html  vite.config.ts  tsconfig*.json  package.json  eslint.config.js
  src/
    main.tsx               # providers: QueryClient, Router, Auth
    App.tsx                # route table
    styles/index.css       # tailwind import, @theme tokens, base styles, glow utilities
    lib/
      api.ts               # typed fetch client, ApiError, 401 handling
      sse.ts               # readSseEvents (ported from sse.js)
      types.ts             # User, Session, Message, Metrics, ToolCall, Connector, Skill
      token.ts             # localStorage token get/set/clear (try/catch)
      format.ts            # dates, seconds, session grouping
    auth/
      AuthProvider.tsx     # token state, login, signup, logout, useAuth
      RequireAuth.tsx      # redirects to /login?next=…
    components/ui/         # Button, IconButton, Input, Field, Dialog, Switch, Spinner, Badge, Tooltip, Logo
    features/
      auth/                # LoginPage, SignupPage, AuthLayout
      layout/              # AppShell, Sidebar, SessionList, UserMenu, TopBar
      chat/                # ChatPage, MessageList, Message, Markdown, CodeBlock, Composer,
                           # MetricsPanel, useChatStream, chatStore
      connectors/          # ConnectorsPage, ConnectorCard, ConnectorDetailDialog, SkillDialog,
                           # ApiKeyDialog, connectorMeta.ts, queries.ts
```

Each feature owns its folder. Shared code lives only in `lib/`, `auth/`, and `components/ui/`.

## Visual language

The reference look: near-black canvas, violet/indigo glow, crisp white type, floating rounded nav, and
**white pill CTAs with a black circular icon chip** (↗).

### Tokens (`@theme`)

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#050507` | page background |
| `--color-surface` | `#111116` | sidebar, cards |
| `--color-surface-2` | `#1a1a22` | hover, user bubble, inputs |
| `--color-surface-3` | `#24242e` | pressed, icon tiles, "+" button |
| `--color-border` | `#2a2a35` | hairlines |
| `--color-border-strong` | `#3a3a48` | focused inputs, card hover |
| `--color-fg` | `#ffffff` | primary text |
| `--color-fg-muted` | `#b4b4c2` | secondary text (≥ 9:1 on bg) |
| `--color-fg-subtle` | `#8a8a99` | hints, "by X" (≥ 5.5:1 on bg) |
| `--color-accent` | `#8b5cf6` | violet accent, focus ring, active item |
| `--color-accent-2` | `#4f6bff` | blue for gradients |
| `--color-success` | `#4ade80` | connected / on |
| `--color-warning` | `#fbbf24` | guardrail message |
| `--color-danger` | `#f87171` | errors, disconnect |
| radii | `--radius-sm 8px`, `--radius-md 12px`, `--radius-lg 16px`, `--radius-xl 24px`, pills `9999px` | |

Body text is white or `fg-muted`, never below 4.5:1. Focus is always visible: a 2px `accent` ring with a
2px `bg` offset.

### Signature elements
- **Glow backdrop** (`.bg-glow`): two blurred radial gradients (violet `#7c3aed` at 35% and blue `#4f6bff`
  at 20%) behind auth pages and the empty chat state, plus a faint grid on auth pages only.
- **Pill CTA** (`<Button variant="pill">`): white background, black text, a 36px black circle on the left
  holding `ArrowUpRight`. Used for the main auth action.
- **Floating pill nav**: auth pages have a centered top bar (logo + "Log in" / "Sign up" link) with a
  `surface` background, a 1px border, and fully rounded corners, like the reference header.
- Headings use Outfit, tight letter-spacing (`-0.02em`), large sizes on auth pages.

### Buttons
`primary` (white bg, black text), `pill` (above), `secondary` (surface-2, border), `ghost` (transparent,
hover surface-2), `danger` (danger text, ghost). Sizes `sm 32px`, `md 40px`, `lg 48px`. Icon buttons are
square with `radius-md`.

## Screens

### Login / Signup
- Full-viewport `bg-glow` with grid; floating pill nav at the top.
- Centered card (max-w 400px, `surface` at 80% + backdrop blur, border, `radius-xl`, padding 32px).
- Title "Welcome back" / "Create your account"; one line of muted subtitle.
- Fields: Email, Password (show/hide eye toggle), Name (signup only, optional). Labels above inputs.
  Inputs are 44px, `surface-2`, and get the accent ring on focus.
- Inline error banner (danger, `role="alert"`) for API errors and the "session expired" message
  (from `?expired=1`).
- Pill CTA "Log in" / "Create account" at full width, with a spinner while busy.
- Footer link to switch pages. Signup shows "At least 8 characters" under Password and validates
  client-side before submitting (matches the backend: min 8, max 128).
- After success, go to `?next=` or `/`.

### App shell (ChatGPT-like)
- **Sidebar** (260px, `surface`, right border):
  - Top: logo + collapse button; "New chat" row (`SquarePen` icon) with the shortcut hint `Ctrl+Shift+O`.
  - Search box that filters chats by title, client-side.
  - Sessions grouped by `updated_at`: Today, Yesterday, Previous 7 days, Previous 30 days, Older.
    Rows are 36px, truncated, `surface-2` on hover, `surface-3` + white text when active.
  - Bottom: "Connectors" row (`Plug` icon, shows the count of connected connectors), then a user row
    (avatar initial + name/email from `GET /users/me`) that opens a DropdownMenu with "Connectors" and
    "Log out".
- Below 768px the sidebar becomes an overlay drawer with a scrim, opened from a hamburger in the top
  bar. It closes on navigation.
- **Top bar** (56px): sidebar toggle (shown when collapsed or on mobile), chat title, and a right-side
  "New chat" icon button when the sidebar is collapsed.

### Chat
- **Empty state** (`/`): vertically centered greeting "What can I help with?" (Outfit, 32px) over a
  soft glow, with the composer directly under it and 3–4 suggestion chips (e.g. "Plan my day with
  Todoist"). Clicking a chip fills the composer.
- **Conversation**: centered column, max-w 768px, 24px gap between turns.
  - User: right-aligned bubble, `surface-2`, `radius-xl`, max-w 80%, `whitespace-pre-wrap`.
  - Assistant: full-width plain markdown with no bubble, preceded by a small logo avatar.
    - Markdown styles: headings, lists, tables (bordered, scrollable), blockquote, inline code
      (`surface-3`), links (accent, underline).
    - Code blocks: a header bar with the language name and a Copy button, then a monospace body on
      `#0b0b10`.
  - Streaming: a blinking caret at the end of the text; before the first token, a "Thinking…"
    shimmer line.
  - Action row under each finished assistant reply (hidden until hover on desktop, always visible on
    touch): Copy, and Metrics (`Info` icon). Metrics opens an inline panel with a grid (input / output /
    total tokens, TTFT, duration, tool calls), a collapsible list of tool calls (name, args, result
    truncated to 1000 chars), and the raw JSON.
  - Errors: a `danger`-tinted callout. Guardrail errors use a `warning` callout with a `ShieldAlert`
    icon.
  - A "scroll to bottom" round button floats above the composer when the user scrolls up. Auto-scroll
    only while the user is within 120px of the bottom.
- **Composer**: docked at the bottom (or centered in the empty state). A `surface-2` rounded-3xl box
  with a 1px border that turns `border-strong` on focus. The textarea autosizes up to 200px. Enter
  sends, Shift+Enter adds a newline, and IME composition is respected. The send button is a 36px white
  circle with `ArrowUp`; while streaming it becomes Stop (square). It is disabled when empty. A
  4000-character limit shows a counter near the limit. Hint line: "Enter to send · Shift+Enter for new
  line".
- New chat flow: the `session` SSE event sets the id, then `navigate('/c/:id', { replace: true })`
  without remounting or clearing the stream. When the stream ends, invalidate the `sessions` query so
  the title appears.

### Connectors (`/settings/connectors`) — modeled on Claude's connector directory
- Header: H1 "Connectors", muted intro line, a count badge, a search input, and segmented tabs
  **All** / **Connected**.
- A toast or banner reports the OAuth redirect result (`?connected=` or `?connector_error=`), then the
  query string is cleaned up.
- **Grid**: 2 columns at ≥ 900px, 1 below; 16px gap. Card: `surface`, `radius-lg`, padding 20px,
  1px border, `border-strong` on hover, whole card clickable (opens the detail dialog).
  - Left: 56px icon tile (`surface-3`, `radius-md`, border) with the connector's monogram on its brand
    color (from `connectorMeta.ts`).
  - Middle: name (white, 17px, medium) plus a status badge; `notes` as the description (fg-muted,
    2-line clamp); "by {provider}" (fg-subtle).
  - Top right: 36px square `surface-3` button:
    - not connected → `Plus` (starts connect)
    - connected and on → `Check` in success color
    - connected but off → `Power` in fg-subtle
- **Detail dialog** (Radix Dialog, max-w 560px): icon, name, provider, description; an "Enabled" Switch
  (same rules as before: turning it on when not connected starts connect; off keeps the login); a
  details list with Server URL (code), Permissions (chips or "Server default"), Tools (chips or "Every
  tool the server offers (attached on demand)"), and Skill ("View SKILL.md" opens SkillDialog).
  Footer: "Disconnect" (danger) when connected, which asks for confirmation inside the dialog, not with
  `confirm()`.
- **Connect flow**: `POST /authorize`. `{url}` → `window.location.href = url`. A 409 means an API key
  is needed, so open ApiKeyDialog (password input, Save) and `PUT /api-key`. No `prompt()` or `alert()`
  anywhere; errors go to an inline message or a toast.
- **SkillDialog**: title "{name} · SKILL.md", description, "Tools it attaches when loaded" chips, and the
  markdown body rendered with the shared `Markdown` component.

`connectorMeta.ts` (frontend only; unknown ids fall back to a neutral monogram):

| id | provider | tile color |
|---|---|---|
| reclaim | Reclaim.ai | `#2f7cf6` |
| todoist | Doist | `#e44332` |
| habitify | Habitify | `#7c5cff` |
| sunsama | Sunsama | `#f5a524` |
| fathom | Fathom | `#00c389` |
| typeform | Typeform | `#262627` (white glyph) |

## Data layer

- `lib/api.ts`: `request<T>(path, init)` adds the bearer token and JSON headers and turns FastAPI
  errors (`detail` as a string or a 422 array) into `ApiError(status, message)`. On 401 for an
  authenticated call it clears the token and fires an `onUnauthorized` callback (AuthProvider navigates
  to `/login?expired=1`). Endpoints: `login` (form-encoded `/auth/token`), `signup`, `me`,
  `listSessions`, `listMessages`, `listConnectors`, `authorizeConnector`, `setConnectorKey`,
  `updateConnector`, `disconnectConnector`, `getConnectorSkill`, `openChatStream`.
- TanStack Query keys: `['me']`, `['sessions']`, `['messages', id]`, `['connectors']`,
  `['skill', id]`. Mutations invalidate `['connectors']`.
- Chat stream state lives in a small reducer (`useChatStream`), not in Query; history comes from
  `['messages', id]`. SSE events handled: `session`, `token`, `metrics`, `guardrail_error`, `error`,
  `done`. Abort with an AbortController on stop, chat switch, or logout.

### Types
```ts
type Metrics = { input_tokens?: number; output_tokens?: number; total_tokens?: number;
  time_to_first_token?: number; duration?: number; num_tools?: number;
  tools?: { name: string; args: unknown; result: unknown }[]; [k: string]: unknown };
type Message = { role: 'user' | 'assistant'; content: string; metrics?: Metrics | null };
type Session = { id: string; user_id: string; title: string | null; created_at: string; updated_at: string };
type Connector = { id: string; name: string; notes: string; url: string; scopes: string[];
  tools: string[] | null; connected: boolean; enabled: boolean; skill: string | null };
type Skill = { name: string; description: string; allowed_tools: string[]; instructions: string };
type User = { id: string; email: string; name: string | null; created_at: string };
```

## Accessibility & quality bar
- Every control is keyboard reachable with visible focus; dialogs trap focus (Radix); the Escape key
  works.
- Icon-only buttons have an `aria-label` and a tooltip.
- The message list is `role="log"` with `aria-live="polite"` on the streaming reply.
- `prefers-reduced-motion` disables the caret blink, shimmer, and glow animation.
- No horizontal scroll at 360px width.
- `npm run build` (runs `tsc -b`) and `npm run lint` pass with zero errors.
