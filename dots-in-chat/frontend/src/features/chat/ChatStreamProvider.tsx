import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { readSseEvents } from '@/lib/sse'
import type { Message, Metrics } from '@/lib/types'
import { ChatStreamContext, initialStreamState, streamReducer, type ChatStreamValue, type TurnInput } from './chatStore'
import { actionMessage, type A2uiMessage, type UiAction } from './a2ui/protocol'

/** Route -> session it shows: an id, null for "/" (new chat), or OTHER for non-chat pages. */
const OTHER = Symbol('other')

function routeSession(pathname: string): string | null | typeof OTHER {
  if (pathname === '/') return null
  const m = matchPath('/c/:sessionId', pathname)
  return m?.params.sessionId ?? OTHER
}

function errorText(err: unknown): string {
  if (err instanceof TypeError) return 'Network error. Check your connection and try again.'
  if (err instanceof Error && err.message) return err.message
  return 'Something went wrong.'
}

/**
 * Owns the live chat stream. Mounted in AppShell so it survives the "/" -> "/c/:id" navigation
 * that happens when a new chat gets its id: ChatPage may re-render or remount, the stream doesn't.
 */
export function ChatStreamProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const route = routeSession(pathname)

  const [state, dispatch] = useReducer(streamReducer, route === OTHER ? null : route, initialStreamState)
  const [newChatCount, setNewChatCount] = useState(0)

  // Refs mirror what async code needs synchronously (the reducer state lags a render behind).
  const sessionIdRef = useRef<string | null>(route === OTHER ? null : route)
  const activeRunRef = useRef<number | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const runCounter = useRef(0)
  const idCounter = useRef(0)
  const hadTurnsRef = useRef(false)
  /** Writes the run's buffered tokens into the state now (tokens are batched per frame). */
  const flushRef = useRef<(() => void) | null>(null)
  const sendRef = useRef<((input: TurnInput | null, attachTo?: string) => Promise<void>) | null>(null)

  const abortActive = useCallback(() => {
    activeRunRef.current = null
    controllerRef.current?.abort()
    controllerRef.current = null
  }, [])

  /** Abort anything in flight and show `sessionId` with no local turns. */
  const reset = useCallback(
    (sessionId: string | null) => {
      abortActive()
      const prev = sessionIdRef.current
      // Local turns of the chat we leave are not in its cached history: drop the cache so a
      // later visit refetches from the server instead of showing the pre-stream snapshot.
      if (prev && hadTurnsRef.current) {
        queryClient.removeQueries({ queryKey: ['messages', prev], exact: true })
      }
      hadTurnsRef.current = false
      sessionIdRef.current = sessionId
      dispatch({ type: 'reset', sessionId })
      // A reply still running on the server for that chat: replay it and follow it live.
      if (sessionId) void sendRef.current?.(null, sessionId)
    },
    [abortActive, queryClient],
  )

  // Follow the URL: switching chats (sidebar, back/forward) or leaving the chat aborts the stream.
  // Only the route is a dependency; a new chat's own navigation matches sessionIdRef, so it's a no-op.
  useEffect(() => {
    if (route === OTHER) {
      if (sessionIdRef.current !== null || hadTurnsRef.current || activeRunRef.current !== null) reset(null)
    } else if (route !== sessionIdRef.current) {
      reset(route)
    }
  }, [route, reset])

  // Unmount (logout, 401 redirect) aborts.
  useEffect(() => abortActive, [abortActive])

  const stop = useCallback(() => {
    const runId = activeRunRef.current
    if (runId === null) return
    const assistantId = `a${runId}`
    flushRef.current?.()
    // Aborting only drops our connection; the run itself is stopped on the server.
    if (sessionIdRef.current) void api.cancelChat(sessionIdRef.current).catch(() => {})
    abortActive()
    dispatch({ type: 'finish', runId, assistantId, status: 'stopped' })
  }, [abortActive])

  const send = useCallback(
    // input null + attachTo: re-attach to the reply running in that chat (no new message).
    async (input: TurnInput | null, attachTo?: string) => {
      if (activeRunRef.current !== null) return
      const runId = ++runCounter.current
      const assistantId = `a${runId}`
      const userId = `u${runId}-${++idCounter.current}`
      const controller = new AbortController()
      controllerRef.current = controller
      activeRunRef.current = runId
      hadTurnsRef.current = true
      const isActive = () => activeRunRef.current === runId
      let sessionId = sessionIdRef.current
      const attaching = input === null
      // Attaching: the turn is shown once the server's replay says what was sent.
      if (input) dispatch({ type: 'start', runId, userId, assistantId, input })

      // Batch tokens into one state update per animation frame. Each update re-parses the whole
      // reply's markdown, so per-chunk updates made long replies cost O(n^2) to render.
      let pending = ''
      let pendingReasoning = ''
      let frame = 0
      // Working time: send -> first piece of the answer (or the end).
      const workStart = performance.now()
      let workDone = false
      const endReasoning = () => {
        if (workDone) return
        workDone = true
        dispatch({ type: 'workDone', runId, assistantId, ms: performance.now() - workStart })
      }
      const flush = () => {
        if (frame) cancelAnimationFrame(frame)
        frame = 0
        if (pendingReasoning) {
          dispatch({ type: 'reasoning', runId, assistantId, content: pendingReasoning })
          pendingReasoning = ''
        }
        if (!pending) return
        dispatch({ type: 'token', runId, assistantId, content: pending })
        pending = ''
      }
      flushRef.current = flush

      let gotDone = false
      let failed = false
      try {
        const res = attaching
          ? await api.attachChatStream(attachTo!, controller.signal)
          : await api.openChatStream(
              'text' in input ? { message: input.text, attachments: input.attachments } : { action: input.action },
              sessionId,
              controller.signal,
            )
        if (attaching && res.status === 204) {
          // Nothing running. If it finished since the history was fetched, refetch it.
          if (isActive()) {
            activeRunRef.current = null
            controllerRef.current = null
            hadTurnsRef.current = false
          }
          void queryClient.invalidateQueries({ queryKey: ['messages', attachTo] })
          return
        }
        for await (const { event, data } of readSseEvents(res)) {
          if (!isActive()) break
          const d = (data ?? {}) as Record<string, unknown>
          switch (event) {
            case 'session': {
              const id = typeof d.session_id === 'string' ? d.session_id : null
              if (!id || id === sessionId) break
              const isNew = sessionId === null
              sessionId = id
              sessionIdRef.current = id
              dispatch({ type: 'session', runId, sessionId: id })
              if (isNew) {
                // Seed an empty history so the /c/:id page doesn't fetch over the live stream.
                queryClient.setQueryData<Message[]>(['messages', id], (old) => old ?? [])
                navigate(`/c/${encodeURIComponent(id)}`, { replace: true })
                void queryClient.invalidateQueries({ queryKey: ['sessions'] })
              }
              break
            }
            case 'user': {
              if (!attaching) break
              const action = d.action as { action: unknown } | null
              const text = typeof d.text === 'string' ? d.text : ''
              const attachments = Array.isArray(d.attachments) ? (d.attachments as string[]) : []
              dispatch({
                type: 'start', runId, userId, assistantId,
                input: action ? { action: action as never } : { text, attachments },
              })
              break
            }
            case 'reasoning':
              if (typeof d.content === 'string' && d.content) {
                pendingReasoning += d.content
                if (!frame) frame = requestAnimationFrame(flush)
              }
              break
            case 'tool_start':
              if (typeof d.id === 'string' && typeof d.name === 'string') {
                flush()
                const args = d.args && typeof d.args === 'object' ? (d.args as Record<string, unknown>) : {}
                dispatch({ type: 'toolStart', runId, assistantId, id: d.id, name: d.name, args })
              }
              break
            case 'tool_end':
              if (typeof d.id === 'string') {
                dispatch({
                  type: 'toolEnd', runId, assistantId, id: d.id,
                  error: d.error === true, result: typeof d.result === 'string' ? d.result : '',
                })
              }
              break
            case 'token':
              if (typeof d.content === 'string' && d.content) {
                endReasoning()
                pending += d.content
                if (!frame) frame = requestAnimationFrame(flush)
              }
              break
            case 'a2ui':
              // Keep text and surfaces in arrival order: write buffered text first.
              endReasoning()
              flush()
              if (d.message && typeof d.message === 'object') {
                dispatch({ type: 'a2ui', runId, assistantId, message: d.message as A2uiMessage })
              }
              break
            case 'a2ui_error':
              // A block the server rejected; it never reaches the screen (a repair run follows).
              console.debug('A2UI block rejected by the server:', d.error)
              break
            case 'file': {
              const kind = d.kind === 'docx' || d.kind === 'pdf' || d.kind === 'html' || d.kind === 'md' || d.kind === 'xlsx' || d.kind === 'pptx' ? d.kind : null
              const act = d.action === 'created' || d.action === 'updated' || d.action === 'deleted' ? d.action : null
              if (typeof d.path === 'string' && kind && act) {
                dispatch({ type: 'file', runId, assistantId, file: { path: d.path, kind, action: act } })
              }
              break
            }
            case 'metrics':
              flush()
              dispatch({ type: 'metrics', runId, assistantId, metrics: d as Metrics })
              break
            case 'guardrail_error':
              flush()
              failed = true
              dispatch({
                type: 'fail', runId, assistantId, kind: 'guardrail',
                message: typeof d.message === 'string' && d.message ? d.message : 'Request blocked by guardrail',
              })
              break
            case 'error':
              flush()
              failed = true
              dispatch({
                type: 'fail', runId, assistantId, kind: 'error',
                message: typeof d.message === 'string' && d.message ? d.message : 'Generation failed',
              })
              break
            case 'done':
              gotDone = true
              break
          }
        }
        if (isActive()) flush()
        if (isActive() && !gotDone && !failed) {
          failed = true
          dispatch({
            type: 'fail', runId, assistantId, kind: 'error',
            message: 'The connection closed before the reply finished.',
          })
        }
      } catch (err) {
        const aborted = controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')
        if (!aborted && isActive()) {
          failed = true
          console.error('Chat streaming error:', err)
          dispatch({ type: 'fail', runId, assistantId, kind: 'error', message: errorText(err) })
        }
      } finally {
        if (isActive()) {
          flush()
          endReasoning()
        }
        else if (frame) cancelAnimationFrame(frame)
        if (flushRef.current === flush) flushRef.current = null
        if (isActive()) {
          activeRunRef.current = null
          controllerRef.current = null
          dispatch({ type: 'finish', runId, assistantId, status: failed ? 'error' : 'done' })
        }
        // New title / updated_at ordering in the sidebar.
        if (sessionId) void queryClient.invalidateQueries({ queryKey: ['sessions'] })
      }
    },
    [navigate, queryClient],
  )

  useEffect(() => {
    sendRef.current = send
  }, [send])

  // Opening /c/:id directly (reload, link): follow a reply still running there.
  useEffect(() => {
    if (sessionIdRef.current) void sendRef.current?.(null, sessionIdRef.current)
  }, [])

  const newChat = useCallback(() => {
    reset(null)
    setNewChatCount((n) => n + 1)
    navigate('/')
  }, [navigate, reset])

  const streaming = state.activeRun !== null
  const sendAction = useCallback((action: UiAction) => void send({ action: actionMessage(action) }), [send])

  const value = useMemo<ChatStreamValue>(
    () => ({
      sessionId: state.sessionId,
      turns: state.turns,
      streaming,
      newChatCount,
      send: (text, attachments) => void send({ text, attachments }),
      sendAction,
      stop,
      newChat,
    }),
    [state, streaming, newChatCount, send, sendAction, stop, newChat],
  )

  return (
    <ChatStreamContext.Provider value={value}>{children}</ChatStreamContext.Provider>
  )
}
