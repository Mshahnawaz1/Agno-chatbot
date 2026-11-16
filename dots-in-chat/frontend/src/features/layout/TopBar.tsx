import { matchPath, useLocation } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Menu, PanelLeftOpen, SquarePen } from 'lucide-react'
import * as api from '@/lib/api'
import { IconButton } from '@/components/ui'
import { useChatStream } from '@/features/chat/chatStore'

function useTitle(): string {
  const { pathname } = useLocation()
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: api.listSessions })
  if (pathname.startsWith('/settings/connectors')) return 'Connectors'
  const id = matchPath('/c/:sessionId', pathname)?.params.sessionId
  if (!id) return 'New chat'
  return sessions.data?.find((s) => s.id === id)?.title || (sessions.isPending ? '' : 'Untitled')
}

export function TopBar({
  showToggle,
  isMobile,
  onToggle,
}: {
  showToggle: boolean
  isMobile: boolean
  onToggle: () => void
}) {
  const { newChat } = useChatStream()
  const title = useTitle()

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-1 px-2 sm:px-3">
      {showToggle ? (
        <IconButton aria-label="Open sidebar" onClick={onToggle}>
          {isMobile ? <Menu className="size-5" aria-hidden /> : <PanelLeftOpen className="size-5" aria-hidden />}
        </IconButton>
      ) : null}
      <p className="min-w-0 flex-1 truncate px-2 font-display text-base font-medium tracking-tight text-fg">
        {title}
      </p>
      {showToggle ? (
        <IconButton aria-label="New chat" onClick={newChat}>
          <SquarePen className="size-5" aria-hidden />
        </IconButton>
      ) : null}
    </header>
  )
}
