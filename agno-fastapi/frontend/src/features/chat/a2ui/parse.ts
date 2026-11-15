/**
 * Splits an assistant reply into markdown text and A2UI blocks.
 *
 * The agent writes A2UI v0.9 messages as JSON between `<a2ui>` and `</a2ui>` (see app/a2ui.py).
 * The same parser runs on the live stream and on history, so both render alike.
 */

export const A2UI_VERSION = 'v0.9'
export const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json'

export type Segment =
  | { kind: 'text'; text: string }
  /** A complete block; A2uiBlock parses `raw` with parseMessages. */
  | { kind: 'ui'; key: string; raw: string }
  /** An unclosed block at the end of a reply that is still streaming. */
  | { kind: 'pending' }

const OPEN = '<a2ui>'
const CLOSE = '</a2ui>'

/** Models sometimes fence the block even when told not to: drop a fence hugging the tags. */
function stripFences(text: string, side: 'before' | 'after'): string {
  return side === 'before' ? text.replace(/```[a-z]*\s*$/i, '') : text.replace(/^\s*```/, '')
}

export function parseSegments(content: string): Segment[] {
  const out: Segment[] = []
  let rest = content
  let index = 0
  while (rest) {
    const open = rest.indexOf(OPEN)
    if (open === -1) {
      out.push({ kind: 'text', text: rest })
      break
    }
    const before = stripFences(rest.slice(0, open), 'before')
    if (before.trim()) out.push({ kind: 'text', text: before })
    const close = rest.indexOf(CLOSE, open + OPEN.length)
    if (close === -1) {
      out.push({ kind: 'pending' })
      break
    }
    const raw = rest.slice(open + OPEN.length, close)
    out.push({ kind: 'ui', key: `ui${index++}`, raw })
    rest = stripFences(rest.slice(close + CLOSE.length), 'after')
  }
  return out
}

/** Hides the partial tag while it streams in ("<a2" ...), so it never flashes as text. */
export function trimPartialTag(text: string): string {
  for (let n = Math.min(OPEN.length - 1, text.length); n > 0; n--) {
    if (OPEN.startsWith(text.slice(-n))) return text.slice(0, -n)
  }
  return text
}

/** The reply as plain text, without its UI blocks (for copy). */
export function textOnly(content: string): string {
  return parseSegments(content)
    .filter((s) => s.kind === 'text')
    .map((s) => s.text.trim())
    .join('\n\n')
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Splits text holding several top-level JSON values ("{...}\n{...}", each possibly spanning
 * lines) into those values' source. Models write messages this way as often as an array.
 */
function splitJsonValues(text: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = -1
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{' || ch === '[') {
      if (depth++ === 0) start = i
    } else if (ch === '}' || ch === ']') {
      if (--depth === 0) out.push(text.slice(start, i + 1))
      if (depth < 0) return []
    }
  }
  return depth === 0 ? out : []
}

/**
 * Accepts a JSON array, `{messages: [...]}`, a single message, or a run of messages (JSONL,
 * pretty-printed or not), and fills in what models tend to leave out (version, catalogId).
 */
export function parseMessages(raw: string): Record<string, unknown>[] | null {
  const text = raw.trim().replace(/^```[a-z]*\s*/i, '').replace(/```$/, '').trim()
  let list: unknown[] | null = null
  try {
    const parsed: unknown = JSON.parse(text)
    if (Array.isArray(parsed)) list = parsed
    else if (isObject(parsed) && Array.isArray(parsed.messages)) list = parsed.messages
    else if (isObject(parsed)) list = [parsed]
  } catch {
    try {
      const values = splitJsonValues(text)
      if (values.length === 0) return null
      list = values.flatMap((v) => {
        const parsed: unknown = JSON.parse(v)
        return Array.isArray(parsed) ? parsed : [parsed]
      })
    } catch {
      return null
    }
  }
  if (!list || !list.every(isObject)) return null
  return list.map((m) => {
    const msg: Record<string, unknown> = { ...m, version: A2UI_VERSION }
    if (isObject(msg.createSurface) && !msg.createSurface.catalogId) {
      msg.createSurface = { ...msg.createSurface, catalogId: BASIC_CATALOG_ID }
    }
    return msg
  })
}

// ---- actions: a click becomes the next user message ----

const ACTION_RE = /^\s*<a2ui-action>([\s\S]*)<\/a2ui-action>\s*$/

export type UiAction = { name: string; surfaceId?: string; context?: Record<string, unknown> }

export function formatAction(action: UiAction): string {
  return `<a2ui-action>${JSON.stringify(action)}</a2ui-action>`
}

/** The action a user message carries, or null for a typed message. */
export function parseAction(content: string): UiAction | null {
  const m = ACTION_RE.exec(content)
  if (!m) return null
  try {
    const v: unknown = JSON.parse(m[1])
    if (isObject(v) && typeof v.name === 'string') return v as UiAction
  } catch {
    // not an action after all
  }
  return null
}
