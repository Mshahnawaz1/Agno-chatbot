import { Check, Plus, Power } from 'lucide-react'
import { Badge, IconButton } from '@/components/ui'
import type { Connector } from '@/lib/types'
import { ConnectorIcon } from './ConnectorIcon'

type Props = {
  connector: Connector
  connecting: boolean
  onOpen: () => void
  onConnect: () => void
}

export function ConnectorCard({ connector: c, connecting, onOpen, onConnect }: Props) {
    const on = c.connected && c.enabled

  return (
    <li className="relative rounded-xl transition-colors hover:bg-surface">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-4 rounded-xl p-3 pr-16 text-left"
      >
        <ConnectorIcon id={c.id} name={c.name} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold leading-6 text-fg">{c.name}</span>
            {c.connected && (
              <Badge variant={c.enabled ? 'success' : 'neutral'}>{c.enabled ? 'On' : 'Off'}</Badge>
            )}
          </span>
          <span className="line-clamp-1 text-sm leading-5 text-fg-muted">{c.notes}</span>
        </span>
      </button>
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {!c.connected ? (
          <IconButton
            variant="secondary"
            aria-label={`Connect ${c.name}`}
            onClick={onConnect}
            disabled={connecting}
            className="border-transparent bg-transparent"
          >
            <Plus className="size-5" aria-hidden />
          </IconButton>
        ) : on ? (
          <IconButton
            variant="secondary"
            aria-label={`${c.name} is on`}
            onClick={onOpen}
            className="border-transparent text-success"
          >
            <Check className="size-5" aria-hidden />
          </IconButton>
        ) : (
          <IconButton
            variant="secondary"
            aria-label={`${c.name} is off`}
            onClick={onOpen}
            className="border-transparent text-fg-subtle"
          >
            <Power className="size-5" aria-hidden />
          </IconButton>
        )}
      </div>
    </li>
  )
}
