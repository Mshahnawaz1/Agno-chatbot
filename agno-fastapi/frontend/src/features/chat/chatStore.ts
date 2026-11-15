import { createContext, useContext } from 'react'
import type { Metrics } from '@/lib/types'
import type { UiAction } from './a2ui/parse'

export type TurnStatus = 'streaming' | 'done' | 'stopped' | 'error'
export type ErrorKind = 'guardrail' | 'error'

/** One message as the chat view renders it: a history message or a local (streamed) turn. */
export type Turn = {
  id: string
  role: 'user' | 'assistant'
  content: string
  metrics: Metrics | null
  error: string | null
  errorKind: ErrorKind | null
  status: TurnStatus
}

export type StreamState = {
  /** Session the local turns belong to; null for a new chat that has no id yet. */
  sessionId: string | null
  /**
   * Id of the run allowed to write into this state. Every action from a run carries its runId,
   * and anything from a run that is no longer active (stopped, chat switched) is dropped.
   */
  activeRun: number | null
  /** Turns sent in this session since it was opened. Shown after the fetched history. */
  turns: Turn[]
}

export type StreamAction =
  | { type: 'reset'; sessionId: string | null }
  | { type: 'start'; runId: number; userId: string; assistantId: string; text: string }
  | { type: 'session'; runId: number; sessionId: string }
  | { type: 'token'; runId: number; assistantId: string; content: string }
  | { type: 'metrics'; runId: number; assistantId: string; metrics: Metrics }
  | { type: 'fail'; runId: number; assistantId: string; message: string; kind: ErrorKind }
  | { type: 'finish'; runId: number; assistantId: string; status: Exclude<TurnStatus, 'streaming'> }

export const initialStreamState = (sessionId: string | null): StreamState => ({
  sessionId,
  activeRun: null,
  turns: [],
})

function updateTurn(state: StreamState, id: string, patch: (t: Turn) => Partial<Turn>): StreamState {
  return { ...state, turns: state.turns.map((t) => (t.id === id ? { ...t, ...patch(t) } : t)) }
}

export function streamReducer(state: StreamState, action: StreamAction): StreamState {
  if (action.type === 'reset') return initialStreamState(action.sessionId)

  if (action.type === 'start') {
    // A new run always takes over; the caller aborts any previous one first.
    return {
      ...state,
      activeRun: action.runId,
      turns: [
        ...state.turns,
        { id: action.userId, role: 'user', content: action.text, metrics: null, error: null, errorKind: null, status: 'done' },
        { id: action.assistantId, role: 'assistant', content: '', metrics: null, error: null, errorKind: null, status: 'streaming' },
      ],
    }
  }

  // Everything below belongs to a run: ignore stale runs.
  if (action.runId !== state.activeRun) return state

  switch (action.type) {
    case 'session':
      return { ...state, sessionId: action.sessionId }
    case 'token':
      return updateTurn(state, action.assistantId, (t) => ({ content: t.content + action.content }))
    case 'metrics':
      return updateTurn(state, action.assistantId, () => ({ metrics: action.metrics }))
    case 'fail':
      return updateTurn(state, action.assistantId, () => ({ error: action.message, errorKind: action.kind }))
    case 'finish': {
      const next = updateTurn(state, action.assistantId, (t) => ({
        status: t.error ? 'error' : action.status,
      }))
      return { ...next, activeRun: null }
    }
  }
}

export type ChatStreamValue = {
  sessionId: string | null
  turns: Turn[]
  streaming: boolean
  /** Bumps on every "New chat" so the page can refocus the composer even when already on "/". */
  newChatCount: number
  send: (text: string) => void
  stop: () => void
  newChat: () => void
}

export const ChatStreamContext = createContext<ChatStreamValue | null>(null)

export function useChatStream(): ChatStreamValue {
  const ctx = useContext(ChatStreamContext)
  if (!ctx) throw new Error('useChatStream must be used inside <ChatStreamProvider>')
  return ctx
}

export const MAX_MESSAGE_LENGTH = 4000

/**
 * For A2UI surfaces: send a click back to the agent. A separate context from the stream state,
 * whose value changes on every token: this one changes only when a run starts or ends, so
 * memoized messages don't re-render while a reply streams.
 */
export type UiActionsValue = { sendAction: (action: UiAction) => void; busy: boolean }

export const UiActionsContext = createContext<UiActionsValue>({ sendAction: () => {}, busy: false })

export function useUiActions(): UiActionsValue {
  return useContext(UiActionsContext)
}
