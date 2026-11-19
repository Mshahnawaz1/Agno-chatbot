import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import type { FileEntry } from '@/lib/types'
import { KIND_ICON } from '@/features/files/kinds'

/** Files matching what follows an "@" in the composer: a listbox the textarea drives with the keyboard. */
export function MentionMenu({
  id,
  items,
  active,
  chosen,
  loading,
  onSelect,
  onHover,
}: {
  id: string
  items: FileEntry[]
  active: number
  chosen: Set<string>
  loading: boolean
  onSelect: (file: FileEntry) => void
  onHover: (index: number) => void
}) {
  const list = useRef<HTMLUListElement>(null)
  const activeEl = useRef<HTMLLIElement>(null)
  // Keep the highlighted row in view by scrolling the list itself. scrollIntoView would also scroll
  // the page's overflow-hidden ancestors, and (in a block body) its Promise return would be taken
  // by React as an effect clean-up function and crash the app.
  useEffect(() => {
    const ul = list.current
    const li = activeEl.current
    if (!ul || !li) return
    if (li.offsetTop < ul.scrollTop) ul.scrollTop = li.offsetTop
    else if (li.offsetTop + li.offsetHeight > ul.scrollTop + ul.clientHeight) ul.scrollTop = li.offsetTop + li.offsetHeight - ul.clientHeight
  }, [active])

  return (
    <div className="absolute inset-x-2 bottom-full z-30 mb-2 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
      <p className="border-b border-border px-3 py-1.5 text-xs text-fg-subtle">Artifacts</p>
      {items.length === 0 ? (
        <p className="px-3 py-4 text-center text-sm text-fg-muted">{loading ? 'Loading…' : 'No matching artifacts'}</p>
      ) : (
        <ul ref={list} id={id} role="listbox" aria-label="Artifacts" className="relative max-h-60 overflow-y-auto p-1">
          {items.map((f, i) => {
            const Icon = KIND_ICON[f.kind]
            const on = chosen.has(f.path)
            return (
              <li
                key={f.path}
                id={`${id}-${i}`}
                ref={i === active ? activeEl : undefined}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: keep focus (and the caret) in the textarea.
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(f)
                }}
                onMouseMove={() => onHover(i)}
                className={clsx(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm',
                  i === active && 'bg-surface-3',
                )}
              >
                <Icon className="size-5 shrink-0 text-accent" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium text-fg">{f.name}</span>
                <span className="shrink-0 text-xs text-fg-subtle">{on ? 'Attached' : f.origin === 'uploaded' ? 'Uploaded' : 'Generated'}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
