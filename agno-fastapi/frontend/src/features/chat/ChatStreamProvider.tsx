import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { readSseEvents } from '@/lib/sse'
import type { Message, Metrics } from '@/lib/types'
import {
  ChatStreamContext,
  initialStreamState,
  streamReducer,
  type ChatStreamValue,
} from './chatStore'

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
    abortActive()
    dispatch({ type: 'finish', runId, assistantId, status: 'stopped' })
  }, [abortActive])

  const send = useCallback(
    async (text: string) => {
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

      dispatch({ type: 'start', runId, userId, assistantId, text })

      let gotDone = false
      let failed = false
      try {
        const res = await api.openChatStream(text, sessionId, controller.signal)
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
            case 'token':
              if (typeof d.content === 'string' && d.content) {
                dispatch({ type: 'token', runId, assistantId, content: d.content })
              }
              break
            case 'metrics':
              dispatch({ type: 'metrics', runId, assistantId, metrics: d as Metrics })
              break
            case 'guardrail_error':
              failed = true
              dispatch({
                type: 'fail', runId, assistantId, kind: 'guardrail',
                message: typeof d.message === 'string' && d.message ? d.message : 'Request blocked by guardrail',
              })
              break
            case 'error':
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

  const newChat = useCallback(() => {
    reset(null)
    setNewChatCount((n) => n + 1)
    navigate('/')
  }, [navigate, reset])

  const value = useMemo<ChatStreamValue>(
    () => ({
      sessionId: state.sessionId,
      turns: state.turns,
      streaming: state.activeRun !== null,
      newChatCount,
      send: (text) => void send(text),
      stop,
      newChat,
    }),
    [state, newChatCount, send, stop, newChat],
  )

  return <ChatStreamContext.Provider value={value}>{children}</ChatStreamContext.Provider>
}
