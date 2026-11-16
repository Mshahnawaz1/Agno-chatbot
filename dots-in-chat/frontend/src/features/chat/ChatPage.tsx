import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CircleAlert } from 'lucide-react'
import clsx from 'clsx'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui'
import { Backdrop } from '@/components/site'
import type { Message } from '@/lib/types'
import { useChatStream, type Turn } from './chatStore'
import { SurfaceFeedContext, type SurfaceFeed } from './a2ui/feed'
import { legacyParts, type A2uiMessage, type Part } from './a2ui/protocol'
import { Composer } from './Composer'
import { MessageList, type MessageListHandle } from './MessageList'

const SUGGESTIONS = [
  'Plan my day with Todoist',
  "What's on my calendar this week?",
  'Summarize my latest meeting',
  'Help me build a new habit',
]

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <div className="ml-auto h-10 w-2/5 animate-pulse rounded-xl bg-surface-2" />
      <div className="flex flex-col gap-2">
        <div className="h-4 w-11/12 animate-pulse rounded-sm bg-surface-2" />
        <div className="h-4 w-4/5 animate-pulse rounded-sm bg-surface-2" />
        <div className="h-4 w-3/5 animate-pulse rounded-sm bg-surface-2" />
      </div>
    </div>
  )
}

/** A stored message's parts; replies from before A2UI v1.0 only have their raw text. */
function historyParts(m: Message): Part[] {
  if (m.role !== 'assistant') return []
  if (m.parts) {
    return m.parts.map((p) => (p.type === 'text' ? { kind: 'text', text: p.text } : { kind: 'a2ui', message: p.message }))
  }
  return legacyParts(m.content ?? '')
}

/**
 * The feed of A2UI messages the chat's surfaces replay. The list is rebuilt on every streamed
 * token, so keep the previous array (and the context value) until a message is added.
 */
function useSurfaceFeed(
  key: string,
  turns: Turn[],
  sendAction: SurfaceFeed['sendAction'],
  busy: boolean,
): SurfaceFeed {
  const all = turns.flatMap((t) => t.parts.flatMap((p) => (p.kind === 'a2ui' ? [p.message] : [])))
  const last = all.at(-1)
  const count = all.length
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const messages = useMemo<A2uiMessage[]>(() => all, [key, count, last])
  return useMemo(() => ({ key, messages, sendAction, busy }), [key, messages, sendAction, busy])
}

export function ChatPage() {
  const { sessionId: routeId = null } = useParams()
  const stream = useChatStream()
  const [draft, setDraft] = useState('')
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<MessageListHandle>(null)

  const history = useQuery({
    queryKey: ['messages', routeId],
    queryFn: () => api.listMessages(routeId!),
    enabled: routeId !== null,
    // History only changes through our own streams, which keep their turns locally;
    // a refetch while a reply is on screen would duplicate it.
    staleTime: Infinity,
    refetchOnReconnect: false,
  })

  const historyTurns = useMemo<Turn[]>(
    () =>
      (routeId ? (history.data ?? []) : []).map((m, i) => {
        const parts = historyParts(m)
        return {
        id: `h${i}`,
        role: m.role,
        // Copy takes the text only (old replies kept their UI JSON inside the text).
        content: m.role === 'assistant' ? parts.flatMap((p) => (p.kind === 'text' ? [p.text] : [])).join('\n\n') : (m.content ?? ''),
        parts,
        reasoning: m.reasoning ?? '',
        reasoningMs: null,
        action: m.action ?? undefined,
        metrics: m.metrics ?? null,
        error: null,
        errorKind: null,
        status: 'done' as const,
        }
      }),
    [routeId, history.data],
  )

  // Local turns belong to the stream's session; ignore them for a frame if the route moved on.
  const ownsTurns = stream.sessionId === routeId
  const turns = useMemo(
    () => (ownsTurns ? [...historyTurns, ...stream.turns] : historyTurns),
    [ownsTurns, historyTurns, stream.turns],
  )
  const feed = useSurfaceFeed(routeId ?? 'new', turns, stream.sendAction, stream.streaming)
  const isEmpty = routeId === null && (!ownsTurns || stream.turns.length === 0)
  const loadingHistory = routeId !== null && history.isPending

  // Focus the composer when a new chat starts (route change to "/" or the New chat action).
  useEffect(() => {
    if (routeId === null) composerRef.current?.focus()
  }, [routeId, stream.newChatCount])

  function send() {
    const text = draft.trim()
    if (!text || stream.streaming || loadingHistory) return
    setDraft('')
    listRef.current?.scrollToBottom()
    stream.send(text)
  }

  function pickSuggestion(text: string) {
    setDraft(text)
    composerRef.current?.focus()
  }

  let footer = null
  if (loadingHistory) footer = <HistorySkeleton />
  else if (routeId && history.isError) {
    const notFound = history.error instanceof ApiError && history.error.status === 404
    footer = (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-danger/30 bg-danger/10 p-4 text-sm">
        <p className="flex items-center gap-2 font-medium text-danger">
          <CircleAlert className="size-4" aria-hidden />
          {notFound ? 'This chat was not found.' : 'Could not load this chat.'}
        </p>
        {!notFound ? <p className="text-fg-muted">{history.error.message}</p> : null}
        <div className="flex gap-2">
          {!notFound ? (
            <Button size="sm" variant="secondary" onClick={() => void history.refetch()}>
              Try again
            </Button>
          ) : null}
          <Link
            to="/"
            className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-fg hover:bg-surface-2"
          >
            New chat
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative isolate flex h-full min-h-0 flex-col">
      {isEmpty ? (
        <>
          <Backdrop orbClassName="top-1/2 w-[min(900px,150vw)] -translate-y-[55%]" fadeAt="70%" fadeTop />
          <div className="flex flex-1 flex-col items-center justify-end px-4 pb-8">
            <h1 className="text-display text-center text-[clamp(2.5rem,6vw,4.5rem)] text-fg [text-shadow:0_4px_40px_rgb(0_0_0/0.35)]">
              What can I help with?
            </h1>
            <p className="mt-3 text-center font-display text-lg text-fg-muted">Ask about your tasks, calendar, meetings or habits</p>
          </div>
        </>
      ) : (
        <SurfaceFeedContext.Provider value={feed}>
          <MessageList ref={listRef} turns={turns} footer={footer} />
        </SurfaceFeedContext.Provider>
      )}

      <div className={clsx('mx-auto w-full max-w-[768px] px-4 sm:px-6', isEmpty ? 'pb-4' : 'pb-3')}>
        <Composer
          ref={composerRef}
          value={draft}
          onChange={setDraft}
          onSubmit={send}
          onStop={stream.stop}
          streaming={stream.streaming}
          canSend={!loadingHistory && !(routeId && history.isError)}
        />
        {isEmpty ? (
          <ul className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Suggestions">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => pickSuggestion(s)}
                  className="rounded-full border border-white/10 bg-surface/70 px-4 py-2 text-sm text-fg-muted backdrop-blur transition-colors hover:border-white/20 hover:bg-surface-2 hover:text-fg"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className={clsx('text-center text-xs text-fg-subtle', isEmpty ? 'mt-4' : 'mt-2')}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>

      {isEmpty ? <div className="flex-1" /> : null}
    </div>
  )
}
