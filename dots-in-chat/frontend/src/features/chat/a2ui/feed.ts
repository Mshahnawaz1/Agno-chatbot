import { createContext, useContext } from 'react'
import type { A2uiMessage, UiAction } from './protocol'
import type { WireMessage } from './renderer'

/**
 * Everything the surfaces of one chat need: every A2UI message the chat has shown, oldest first
 * (history, then this visit's turns), and where clicks go. The renderer replays the messages
 * into one processor per chat, so a later turn's update changes a surface where it first appeared.
 */
export type SurfaceFeed = {
  /** The chat this feed belongs to; a new key starts a new processor. */
  key: string
  messages: A2uiMessage[]
  /** How many of `messages` come from stored history: replayed quietly, never reported to the agent. */
  historyCount: number
  sendAction: (action: UiAction) => void
  /** A renderer `error` message for the agent. */
  reportError: (error: WireMessage) => void
  /** A reply is streaming: surfaces are inert, since only one run goes at a time. */
  busy: boolean
}

export const SurfaceFeedContext = createContext<SurfaceFeed | null>(null)

export function useSurfaceFeed(): SurfaceFeed {
  const feed = useContext(SurfaceFeedContext)
  if (!feed) throw new Error('A surface must be rendered inside <SurfaceFeedContext>')
  return feed
}
