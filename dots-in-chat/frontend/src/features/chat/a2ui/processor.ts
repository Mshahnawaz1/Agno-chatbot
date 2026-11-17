import { useLayoutEffect, useSyncExternalStore } from 'react'
import { MessageProcessor, type ActionPayload } from '@a2ui/web_core/v1_0'
import type { ReactCatalogComponent } from '@a2ui/react/v0_9'
import { catalogs, upgradeMessage } from './catalog'
import type { SurfaceFeed } from './feed'
import type { A2uiMessage, UiAction } from './protocol'

/** One chat's processor and how far through its feed it is. */
type Entry = {
  processor: MessageProcessor<ReactCatalogComponent>
  /** How many of the feed's messages are applied, and the last one applied. */
  applied: number
  last: A2uiMessage | undefined
  onAction: (action: UiAction) => void
  /** Bumped whenever messages are applied, so surfaces re-render. */
  version: number
  listeners: Set<() => void>
}

/** One processor per chat. Chats are few, so entries are kept for the page's lifetime. */
const entries = new Map<string, Entry>()

function newProcessor(entry: Entry) {
  return new MessageProcessor<ReactCatalogComponent>(catalogs, (a: ActionPayload) => entry.onAction(a as UiAction))
}

function entryFor(key: string): Entry {
  let entry = entries.get(key)
  if (!entry) {
    entry = { processor: undefined as never, applied: 0, last: undefined, onAction: () => {}, version: 0, listeners: new Set() }
    entry.processor = newProcessor(entry)
    entries.set(key, entry)
  }
  return entry
}

/**
 * Brings the chat's processor up to date with its feed. Messages only ever get appended, so
 * normally just the new ones are applied; if the list was replaced (history refetched), the
 * processor is rebuilt from scratch. Runs in an effect: applying messages updates the
 * renderer's signals, which must not happen while React renders.
 */
function sync(feed: SurfaceFeed) {
  const entry = entryFor(feed.key)
  entry.onAction = feed.sendAction
  const { messages } = feed
  const replaced = entry.applied > messages.length || messages[entry.applied - 1] !== entry.last
  if (replaced) {
    entry.processor = newProcessor(entry)
    entry.applied = 0
    entry.last = undefined
  }
  if (!replaced && entry.applied === messages.length) return
  const errors = entry.processor.processMessagesWithErrors(messages.slice(entry.applied).map(upgradeMessage))
  // The server validated these against the same catalog, so an error here is a bug to look at.
  if (errors.length) console.warn('A2UI renderer errors:', errors)
  entry.applied = messages.length
  entry.last = messages.at(-1)
  entry.version++
  entry.listeners.forEach((l) => l())
}

/** The chat's processor, kept in step with the feed; re-renders when messages are applied. */
export function useProcessor(feed: SurfaceFeed): MessageProcessor<ReactCatalogComponent> {
  const entry = entryFor(feed.key)
  useSyncExternalStore(
    (onChange) => {
      entry.listeners.add(onChange)
      return () => entry.listeners.delete(onChange)
    },
    () => entry.version,
  )
  useLayoutEffect(() => sync(feed), [feed])
  return entry.processor
}

/** Whether the processor has caught up with the feed (a surface missing before that is pending). */
export function isSynced(feed: SurfaceFeed): boolean {
  const entry = entries.get(feed.key)
  return !!entry && entry.applied === feed.messages.length && feed.messages.at(-1) === entry.last
}
