import clsx from 'clsx'
import { BookOpenText } from 'lucide-react'
import type { Source } from '@/lib/types'
import { useFilePanelContext } from '@/features/files/useFilePanel'

const MAX_CHIPS = 3 // more than this shows as "+N", so every card is the same size

type Group = { name: string; path: string | null; passages: Source[] }

/** One card per file, its passages in page order. */
function groupByFile(sources: Source[]): Group[] {
  const groups = new Map<string, Group>()
  for (const s of sources) {
    const key = s.path ?? s.name
    const g = groups.get(key) ?? { name: s.name, path: s.path, passages: [] }
    g.passages.push(s)
    groups.set(key, g)
  }
  for (const g of groups.values()) g.passages.sort((a, b) => (a.page ?? 0) - (b.page ?? 0) || (a.chunk ?? 0) - (b.chunk ?? 0))
  return [...groups.values()]
}

function where(s: Source): string {
  const parts = []
  if (s.page != null) parts.push(`p.${s.page}`)
  if (s.chunk != null) parts.push(`#${s.chunk}`)
  return parts.join(' · ') || 'note'
}

/** What the reply was based on: one card per file, showing which pages and chunks it used; a click opens the file in the panel. */
export function SourceCards({ sources }: { sources: Source[] }) {
  const { path: openPath, open } = useFilePanelContext()
  const groups = groupByFile(sources)
  return (
    <section aria-label="Sources" className="mt-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
        <BookOpenText className="size-3.5" aria-hidden />
        Sources
      </p>
      <ul className="flex flex-wrap gap-2">
        {groups.map((g) => {
          const shown = g.passages.slice(0, MAX_CHIPS)
          const extra = g.passages.length - shown.length
          const body = (
            <>
              <span className="block truncate text-sm font-medium text-fg">{g.name}</span>
              <span className="mt-1.5 flex flex-nowrap gap-1 overflow-hidden whitespace-nowrap">
                {shown.map((p, i) => (
                  <span key={`${p.page}:${p.chunk}:${i}`} className="rounded-sm bg-surface-3 px-1.5 py-0.5 text-xs text-fg-muted">
                    {where(p)}
                  </span>
                ))}
                {extra > 0 ? <span className="px-0.5 py-0.5 text-xs text-fg-subtle">+{extra}</span> : null}
              </span>
            </>
          )
          const base = 'flex h-16 w-full flex-col items-stretch justify-start overflow-hidden rounded-md border px-3 py-2 text-left transition-colors'
          return (
            <li key={g.path ?? g.name} className="w-56 max-w-full">
              {g.path ? (
                <button
                  type="button"
                  onClick={() => open(g.path!)}
                  aria-pressed={openPath === g.path}
                  title={`Open ${g.name}: ${g.passages.map(where).join(', ')}`}
                  className={clsx(
                    base,
                    openPath === g.path
                      ? 'border-border-strong bg-surface-3'
                      : 'border-border bg-surface-2 hover:border-border-strong hover:bg-surface-3',
                  )}
                >
                  {body}
                </button>
              ) : (
                <div className={clsx(base, 'border-border bg-surface-2')}>{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
