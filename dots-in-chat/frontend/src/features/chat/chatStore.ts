import { createContext, useContext } from 'react'
import type { FileRef, Metrics } from '@/lib/types'
import type { Step } from './activity'
import type { A2uiMessage, ActionMessage, Part, UiAction } from './a2ui/protocol'

export type TurnStatus = 'streaming' | 'done' | 'stopped' | 'error'
export type ErrorKind = 'guardrail' | 'error'

/** One message as the chat view renders it: a history message or a local (streamed) turn. */
export type Turn = {
  id: string
  role: 'user' | 'assistant'
  /** The turn's text (assistant: its text parts joined, for copy). */
  content: string
  /** Assistant turns: text and A2UI messages in the order they arrived. */
  parts: Part[]
  /** Assistant turns: what the agent did before (and between) its answer: thoughts and tool calls. */
  steps: Step[]
  /** When the run started (ms since epoch); null for stored history. */
  startedAt: number | null
  /** How long the agent worked before answering; null while working or when unknown (history). */
  workMs: number | null
  /** User turns started by a click on a surface. */
  action?: UiAction
  /** Assistant turns: workspace files the agent created, updated or deleted. */
  files: FileRef[]
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
  | { type: 'start'; runId: number; userId: string; assistantId: string; input: TurnInput }
  | { type: 'session'; runId: number; sessionId: string }
  | { type: 'token'; runId: number; assistantId: string; content: string }
  | { type: 'reasoning'; runId: number; assistantId: string; content: string }
  | { type: 'toolStart'; runId: number; assistantId: string; id: string; name: string; args: Record<string, unknown> }
  | { type: 'toolEnd'; runId: number; assistantId: string; id: string; error: boolean; result: string }
  | { type: 'workDone'; runId: number; assistantId: string; ms: number }
  | { type: 'a2ui'; runId: number; assistantId: string; message: A2uiMessage }
  | { type: 'file'; runId: number; assistantId: string; file: FileRef }
  | { type: 'metrics'; runId: number; assistantId: string; metrics: Metrics }
  | { type: 'fail'; runId: number; assistantId: string; message: string; kind: ErrorKind }
  | { type: 'finish'; runId: number; assistantId: string; status: Exclude<TurnStatus, 'streaming'> }

/** What a turn sends: typed text, or a click on a surface. */
export type TurnInput = { text: string } | { action: ActionMessage }

export const initialStreamState = (sessionId: string | null): StreamState => ({
  sessionId,
  activeRun: null,
  turns: [],
})

function updateTurn(state: StreamState, id: string, patch: (t: Turn) => Partial<Turn>): StreamState {
  return { ...state, turns: state.turns.map((t) => (t.id === id ? { ...t, ...patch(t) } : t)) }
}

/** Adds streamed text to the turn's last text part, or starts one after a surface. */
function appendText(parts: Part[], text: string): Part[] {
  const last = parts.at(-1)
  if (last?.kind === 'text') return [...parts.slice(0, -1), { kind: 'text', text: last.text + text }]
  return [...parts, { kind: 'text', text }]
}

/** One entry per path: a later event replaces the earlier one (a file created then edited stays "created"). */
export function mergeFile(files: FileRef[], file: FileRef): FileRef[] {
  const prev = files.find((f) => f.path === file.path)
  if (!prev) return [...files, file]
  const action = file.action === 'updated' && prev.action === 'created' ? 'created' : file.action
  return files.map((f) => (f.path === file.path ? { ...file, action } : f))
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
        {
          id: action.userId, role: 'user', parts: [], files: [], steps: [], startedAt: null, workMs: null, metrics: null, error: null, errorKind: null, status: 'done',
          ...('text' in action.input ? { content: action.input.text } : { content: '', action: action.input.action.action }),
        },
        { id: action.assistantId, role: 'assistant', content: '', parts: [], files: [], steps: [], startedAt: Date.now(), workMs: null, metrics: null, error: null, errorKind: null, status: 'streaming' },
      ],
    }
  }

  // Everything below belongs to a run: ignore stale runs.
  if (action.runId !== state.activeRun) return state

  switch (action.type) {
    case 'session':
      return { ...state, sessionId: action.sessionId }
    case 'token':
      return updateTurn(state, action.assistantId, (t) => ({
        content: t.content + action.content,
        parts: appendText(t.parts, action.content),
      }))
    case 'reasoning':
      return updateTurn(state, action.assistantId, (t) => {
        // Thoughts stream in pieces; a thought after a tool call starts a new step.
        const last = t.steps.at(-1)
        if (last?.kind === 'thought') {
          return { steps: [...t.steps.slice(0, -1), { ...last, text: last.text + action.content }] }
        }
        return { steps: [...t.steps, { kind: 'thought', id: `t${t.steps.length}`, text: action.content }] }
      })
    case 'toolStart':
      return updateTurn(state, action.assistantId, (t) => ({
        steps: [...t.steps, { kind: 'tool', id: action.id, name: action.name, args: action.args, status: 'running' }],
      }))
    case 'toolEnd':
      return updateTurn(state, action.assistantId, (t) => ({
        steps: t.steps.map((st) =>
          st.kind === 'tool' && st.id === action.id
            ? { ...st, status: action.error ? 'error' : 'done', result: action.result }
            : st,
        ),
      }))
    case 'workDone':
      return updateTurn(state, action.assistantId, (t) => (t.workMs === null ? { workMs: action.ms } : {}))
    case 'a2ui':
      return updateTurn(state, action.assistantId, (t) => ({
        parts: [...t.parts, { kind: 'a2ui', message: action.message }],
      }))
    case 'file':
      return updateTurn(state, action.assistantId, (t) => ({ files: mergeFile(t.files, action.file) }))
    case 'metrics':
      return updateTurn(state, action.assistantId, () => ({ metrics: action.metrics }))
    case 'fail':
      return updateTurn(state, action.assistantId, () => ({ error: action.message, errorKind: action.kind }))
    case 'finish': {
      const next = updateTurn(state, action.assistantId, (t) => ({
        status: t.error ? 'error' : action.status,
        // A stopped or failed run leaves no tool spinning.
        steps: t.steps.map((st) => (st.kind === 'tool' && st.status === 'running' ? { ...st, status: 'error' as const } : st)),
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
  /** A click on an A2UI surface: sent to the agent as the next turn. */
  sendAction: (action: UiAction) => void
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
