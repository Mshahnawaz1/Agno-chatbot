import { useMemo, useState } from 'react'
import { Link, NavLink, matchPath, useLocation } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, PanelLeftClose, Plug, Search, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import * as api from '@/lib/api'
import { groupSessionsByDate } from '@/lib/format'
import { IconButton, Logo } from '@/components/ui'
import { useChatStream } from '@/features/chat/chatStore'
import { UserMenu } from './UserMenu'
import { IS_MAC } from './useMediaQuery'

const SHORTCUT = IS_MAC ? '⇧⌘O' : 'Ctrl+Shift+O'

const rowBase =
  'flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-sm transition-colors'

function SessionList({ query, onNavigate }: { query: string; onNavigate: () => void }) {
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: api.listSessions })
  const queryClient = useQueryClient()
  const { newChat } = useChatStream()
  const { pathname } = useLocation()
  const remove = useMutation({
    mutationFn: api.deleteSession,
    onSuccess: (_, id) => {
      // Deleting the chat on screen: go back to a blank new chat.
      if (matchPath('/c/:sessionId', pathname)?.params.sessionId === id) newChat()
      void queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = sessions.data ?? []
    const filtered = q ? list.filter((s) => (s.title || 'Untitled').toLowerCase().includes(q)) : list
    return groupSessionsByDate(filtered)
  }, [sessions.data, query])

  if (sessions.isPending) {
    return (
      <div className="flex flex-col gap-1.5 px-2.5 pt-2" aria-label="Loading chats" role="status">
        {[70, 55, 80, 45, 65, 50].map((w, i) => (
          <div key={i} className="h-5 animate-pulse rounded-sm bg-surface-2" style={{ width: `${w}%` }} />
        ))}
      </div>
    )
  }

  if (sessions.isError) {
    return (
      <div role="alert" className="px-2.5 pt-2 text-sm">
        <p className="text-danger">Could not load chats.</p>
        <button
          type="button"
          onClick={() => void sessions.refetch()}
          className="mt-1 rounded-sm text-fg-muted underline underline-offset-2 hover:text-fg"
        >
          Try again
        </button>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <p className="px-2.5 pt-2 text-sm text-fg-subtle">
        {query.trim() ? 'No matching chats' : 'No chats yet'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <section key={g.label} aria-label={g.label}>
          <h2 className="px-2.5 pb-1 font-sans text-xs font-medium tracking-normal text-fg-subtle">{g.label}</h2>
          <ul className="flex flex-col gap-px">
            {g.sessions.map((s) => (
              <li key={s.id} className="group relative">
                <NavLink
                  to={`/c/${encodeURIComponent(s.id)}`}
                  onClick={onNavigate}
                  title={s.title || 'Untitled'}
                  className={({ isActive }) =>
                    clsx(
                      rowBase,
                      isActive ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                    )
                  }
                >
                  <span className="truncate pr-6">{s.title || 'Untitled'}</span>
                </NavLink>
                <button
                  type="button"
                  aria-label={`Delete chat: ${s.title || 'Untitled'}`}
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm('Delete this chat? This cannot be undone.')) remove.mutate(s.id)
                  }}
                  className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-fg-subtle opacity-0 transition hover:bg-surface-3 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function Sidebar({ onClose, onNavigate }: { onClose: () => void; onNavigate: () => void }) {
  const { newChat } = useChatStream()
  const [query, setQuery] = useState('')
  const connectors = useQuery({ queryKey: ['connectors'], queryFn: api.listConnectors })
  const connectedCount = connectors.data?.filter((c) => c.connected).length ?? 0

  return (
    <nav aria-label="Chats" className="flex h-full w-[260px] flex-col bg-surface/80 backdrop-blur-xl">
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <Link
          to="/"
          onClick={(e) => {
            e.preventDefault()
            newChat()
            onNavigate()
          }}
          className="rounded-full"
          aria-label="Dots-in Chat, new chat"
        >
          <Logo wordmark size={26} />
        </Link>
        <IconButton aria-label="Close sidebar" onClick={onClose} tooltip>
          <PanelLeftClose className="size-5" aria-hidden />
        </IconButton>
      </div>

      <div className="flex shrink-0 flex-col gap-2 px-2 pb-2">
        <button
          type="button"
          onClick={() => {
            newChat()
            onNavigate()
          }}
          className="group flex h-10 w-full items-center gap-2 rounded-full bg-white pl-1 pr-4 text-sm font-medium text-black transition-colors hover:bg-white/90 active:bg-white/80"
          aria-keyshortcuts={IS_MAC ? 'Meta+Shift+O' : 'Control+Shift+O'}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-black text-white">
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden />
          </span>
          <span className="flex-1 text-left">New chat</span>
          <kbd className="hidden font-sans text-xs text-black/50 md:inline">{SHORTCUT}</kbd>
        </button>
        <label className="relative block">
          <span className="sr-only">Search chats</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="h-9 w-full rounded-full border border-border bg-surface-2 pl-8 pr-2.5 text-sm text-fg placeholder:text-fg-subtle transition-colors hover:border-border-strong focus-visible:border-border-strong"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <SessionList query={query} onNavigate={onNavigate} />
      </div>

      <div className="flex shrink-0 flex-col gap-1 border-t border-white/10 p-2">
        <NavLink
          to="/settings/connectors"
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(rowBase, isActive ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg')
          }
        >
          <Plug className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">Connectors</span>
          {connectedCount > 0 ? (
            <span
              className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
              aria-label={`${connectedCount} connected`}
            >
              {connectedCount}
            </span>
          ) : null}
        </NavLink>
        <UserMenu onNavigate={onNavigate} />
      </div>
    </nav>
  )
}
