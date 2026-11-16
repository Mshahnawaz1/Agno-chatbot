import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronsUpDown, LogOut, Plug } from 'lucide-react'
import * as api from '@/lib/api'
import { useAuth } from '@/auth'

const itemClass =
  'flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-sm px-2.5 text-sm outline-none'

export function UserMenu({ onNavigate }: { onNavigate: () => void }) {
  const me = useQuery({ queryKey: ['me'], queryFn: api.me })
  const { logout } = useAuth()
  const navigate = useNavigate()

  const name = me.data?.name?.trim() || ''
  const email = me.data?.email ?? ''
  const initial = (name || email || '?').charAt(0).toUpperCase()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-surface-2 data-[state=open]:bg-surface-2">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-accent to-accent-2 text-sm font-semibold text-white"
        >
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          {me.isPending ? (
            <span className="block h-4 w-24 animate-pulse rounded-sm bg-surface-2" />
          ) : (
            <>
              <span className="block truncate text-sm font-medium text-fg">{name || email || 'Account'}</span>
              {name && email ? <span className="block truncate text-xs text-fg-subtle">{email}</span> : null}
            </>
          )}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-fg-subtle" aria-hidden />
        <span className="sr-only">Open account menu</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[220px] rounded-xl border border-white/10 bg-surface-2/95 backdrop-blur-xl p-1 shadow-2xl"
        >
          {email ? (
            <div className="truncate px-2.5 py-2 text-xs text-fg-subtle">{email}</div>
          ) : null}
          <DropdownMenu.Item
            className={`${itemClass} text-fg data-[highlighted]:bg-surface-3`}
            onSelect={() => {
              navigate('/settings/connectors')
              onNavigate()
            }}
          >
            <Plug className="size-4 text-fg-muted" aria-hidden />
            Connectors
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item className={`${itemClass} text-danger data-[highlighted]:bg-danger/10`} onSelect={logout}>
            <LogOut className="size-4" aria-hidden />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
