import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CircleAlert } from 'lucide-react'
import clsx from 'clsx'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui'
import { useChatStream, type Turn } from './chatStore'
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
      (routeId ? (history.data ?? []) : []).map((m, i) => ({
        id: `h${i}`,
        role: m.role,
        content: m.content ?? '',
        metrics: m.metrics ?? null,
        error: null,
        errorKind: null,
        status: 'done',
      })),
    [routeId, history.data],
  )

  // Local turns belong to the stream's session; ignore them for a frame if the route moved on.
  const ownsTurns = stream.sessionId === routeId
  const turns = useMemo(
    () => (ownsTurns ? [...historyTurns, ...stream.turns] : historyTurns),
    [ownsTurns, historyTurns, stream.turns],
  )
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
    <div className="relative flex h-full min-h-0 flex-col">
      {isEmpty ? (
        <div className="relative flex flex-1 flex-col items-center justify-end px-4 pb-8">
          <div aria-hidden className="bg-glow pointer-events-none absolute inset-0 opacity-70 [background-position:center_bottom]" />
          <h1 className="relative text-center font-display text-[32px] font-semibold leading-tight tracking-tight text-fg">
            What can I help with?
          </h1>
        </div>
      ) : (
        <MessageList ref={listRef} turns={turns} footer={footer} />
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
                  className="rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-fg-muted transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-fg"
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
