import clsx from 'clsx'
import { getConnectorMeta } from './connectorMeta'

export function ConnectorIcon({ id, name, className }: { id: string; name: string; className?: string }) {
  const meta = getConnectorMeta(id, name)
  return (
    <span
      aria-hidden
      className={clsx(
        'grid shrink-0 place-items-center rounded-md border border-border bg-surface-3 p-1.5',
        className ?? 'size-14',
      )}
    >
      <span
        className="grid size-full place-items-center rounded-sm font-display text-xl font-semibold"
        style={{ backgroundColor: meta.color, color: meta.textColor }}
      >
        {meta.monogram}
      </span>
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
