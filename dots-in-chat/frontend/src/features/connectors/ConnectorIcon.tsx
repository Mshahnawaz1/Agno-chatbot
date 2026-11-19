import { useState } from 'react'
import clsx from 'clsx'
import { getConnectorMeta } from './connectorMeta'

export function ConnectorIcon({ id, name, className }: { id: string; name: string; className?: string }) {
  const meta = getConnectorMeta(id, name)
  const [failed, setFailed] = useState(false)
  const showLogo = meta.logo && !failed
  return (
    <span
      aria-hidden
      className={clsx(
        'grid shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface-3',
        showLogo ? 'p-0' : 'p-1.5',
        className ?? 'size-12',
      )}
    >
      {showLogo ? (
        <img src={meta.logo} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        <span
          className="grid size-full place-items-center rounded-md font-display text-xl font-semibold"
          style={{ backgroundColor: meta.color, color: meta.textColor }}
        >
          {meta.monogram}
        </span>
      )}
    </span>
  )
}

export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li
          key={t}
          className="break-all rounded-sm bg-surface-3 px-2 py-0.5 font-mono text-xs text-fg-muted"
        >
          {t}
        </li>
      ))}
    </ul>
  )
}
