/**
 * A2UI v1.0 as the chat sees it: wire messages from the server, a turn's parts, and the action
 * message a click sends back. Plain data, no renderer: this file is in the main bundle.
 *
 * The server compiles the model's reply (app/a2ui/turn.py) and streams text and A2UI messages
 * separately, so nothing here parses model output.
 */

/** One agent-to-renderer message (createSurface, updateComponents, updateDataModel, deleteSurface). */
export type A2uiMessage = Record<string, unknown> & { version: string }

/** What an assistant turn shows, in order. */
export type Part =
  | { kind: 'text'; text: string }
  | { kind: 'a2ui'; message: A2uiMessage }
  /** A reply from before A2UI v1.0, whose interactive part can no longer be drawn. */
  | { kind: 'legacy' }

/** A click, as the renderer reports it (web_core's ActionPayload). */
export type UiAction = {
  name: string
  surfaceId: string
  sourceComponentId: string
  timestamp: string
  context: Record<string, unknown>
}

/** The renderer-to-agent message the server expects for a click. */
export type ActionMessage = { version: '1.0'; action: UiAction }

export function actionMessage(a: UiAction): ActionMessage {
  // Only the fields the v1.0 schema allows.
  return {
    version: '1.0',
    action: {
      name: a.name,
      surfaceId: a.surfaceId,
      sourceComponentId: a.sourceComponentId,
      timestamp: a.timestamp,
      context: a.context ?? {},
    },
  }
}

/** The id of the surface a message creates, or null. A surface is drawn where it was created. */
export function createdSurfaceId(message: A2uiMessage): string | null {
  const create = message.createSurface as { surfaceId?: unknown } | undefined
  return typeof create?.surfaceId === 'string' ? create.surfaceId : null
}

// ---- replies stored before v1.0 ----

const LEGACY_BLOCK = /```[a-z]*\s*<a2ui>[\s\S]*?<\/a2ui>\s*```|<a2ui>[\s\S]*?(?:<\/a2ui>|$)/g

/** Old replies kept v0.9 JSON inside `<a2ui>` in their text: cut it out and mark where it was. */
export function legacyParts(content: string): Part[] {
  const parts: Part[] = []
  let last = 0
  for (const m of content.matchAll(LEGACY_BLOCK)) {
    const text = content.slice(last, m.index).trim()
    if (text) parts.push({ kind: 'text', text })
    parts.push({ kind: 'legacy' })
    last = m.index + m[0].length
  }
  const rest = content.slice(last).trim()
  if (rest) parts.push({ kind: 'text', text: rest })
  return parts
}
