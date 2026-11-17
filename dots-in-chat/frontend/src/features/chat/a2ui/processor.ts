import { useLayoutEffect, useSyncExternalStore } from 'react'
import { MessageProcessor } from '@a2ui/web_core/v1_0'
import type { ReactCatalogComponent } from '@a2ui/react/v0_9'
import { catalog } from './catalog'
import type { SurfaceFeed } from './feed'
import { Renderer, type WireMessage } from './renderer'
import type { A2uiMessage } from './protocol'

/** One renderer per chat. Chats are few, so entries are kept for the page's lifetime. */
const entries = new Map<string, Renderer<ReactCatalogComponent>>()

/** Where the renderer's RPC messages go (set once by the chat stream provider). */
let transport: ((key: string, message: WireMessage) => Promise<WireMessage[]>) | undefined

export function setRendererTransport(t: typeof transport) {
  transport = t
}

/** The chat's renderer; made on first use. */
export function rendererFor(key: string): Renderer<ReactCatalogComponent> {
  let r = entries.get(key)
  if (!r) {
    r = new Renderer<ReactCatalogComponent>(catalog, {
      sendAction: () => {},
      reportError: () => {},
      transport: (m) => (transport ? transport(key, m) : Promise.resolve([])),
    })
    entries.set(key, r)
  }
  return r
}

/**
 * What every request to the agent carries about this renderer: its capabilities (from the
 * real catalog) and the data models of the surfaces that asked for them (`sendDataModel`).
 */
export function rendererContext(key: string | null) {
  const r = rendererFor(key ?? 'new')
  const dataModel = r.dataModel()
  return {
    a2uiRendererCapabilities: r.capabilities(),
    ...(dataModel ? { a2uiRendererDataModel: dataModel } : {}),
  }
}

/**
 * Brings the chat's processor up to date with its feed. Messages only ever get appended, so
 * normally just the new ones are applied; if the list was replaced (history refetched), the
 * processor is rebuilt from scratch. Runs in an effect: applying messages updates the
 * renderer's signals, which must not happen while React renders.
 */
function sync(feed: SurfaceFeed) {
  const r = rendererFor(feed.key)
  r.io.sendAction = feed.sendAction as never
  r.io.reportError = feed.reportError
  const { messages } = feed
  const replaced = r.applied > messages.length || messages[r.applied - 1] !== r.last
  if (replaced) r.reset()
  if (!replaced && r.applied === messages.length) return
  // Stored history is replayed quietly; what a reply streams now is live.
  const from = r.applied
  const quiet = Math.max(0, Math.min(messages.length, feed.historyCount) - from)
  if (quiet > 0) r.apply(messages.slice(from, from + quiet) as WireMessage[], false)
  if (from + quiet < messages.length) r.apply(messages.slice(from + quiet) as WireMessage[], true)
  r.applied = messages.length
  r.last = messages.at(-1)
  r.version++
  r.listeners.forEach((l) => l())
}

/** The chat's processor, kept in step with the feed; re-renders when messages are applied. */
export function useProcessor(feed: SurfaceFeed): MessageProcessor<ReactCatalogComponent> {
  const r = rendererFor(feed.key)
  useSyncExternalStore(
    (onChange) => {
      r.listeners.add(onChange)
      return () => r.listeners.delete(onChange)
    },
    () => r.version,
  )
  useLayoutEffect(() => sync(feed), [feed])
  return r.processor
}

/** Whether the processor has caught up with the feed (a surface missing before that is pending). */
export function isSynced(feed: SurfaceFeed): boolean {
  const r = entries.get(feed.key)
  return !!r && r.applied === feed.messages.length && (feed.messages.at(-1) as A2uiMessage | undefined) === r.last
}
