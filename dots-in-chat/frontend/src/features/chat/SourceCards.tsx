import clsx from 'clsx'
import { BookOpenText } from 'lucide-react'
import type { Source } from '@/lib/types'
import { useFilePanelContext } from '@/features/files/useFilePanel'

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
  if (s.page != null) parts.push(`p. ${s.page}`)
  if (s.chunk != null) parts.push(`chunk ${s.chunk}`)
  return parts.join(' · ') || 'note'
}

/** What the reply was based on: one card per file, listing the pages and chunks it used with a short
 *  excerpt of each; a click opens the file in the panel. */
export function SourceCards({ sources }: { sources: Source[] }) {
  const { path: openPath, open } = useFilePanelContext()
  const groups = groupByFile(sources)
  return (
    <section aria-label="Sources" className="mt-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
        <BookOpenText className="size-3.5" aria-hidden />
        Sources
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {groups.map((g) => {
          const pages = [...new Set(g.passages.map((p) => p.page).filter((p): p is number => p != null))]
          const body = (
            <>
              <span className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium text-fg">{g.name}</span>
                <span className="shrink-0 text-xs text-fg-subtle">
                  {pages.length ? `${pages.length === 1 ? 'Page' : 'Pages'} ${pages.join(', ')}` : 'Text note'}
                </span>
              </span>
              <span className="mt-1.5 flex flex-col gap-1.5">
                {g.passages.map((p, i) => (
                  <span key={`${p.page}:${p.chunk}:${i}`} className="block text-xs leading-5">
                    <span className="font-medium text-fg-muted">{where(p)}</span>
                    <span className="line-clamp-1 block text-fg-subtle">{p.snippet}</span>
                  </span>
                ))}
              </span>
            </>
          )
          const base = 'flex h-full w-full flex-col items-stretch justify-start rounded-md border px-3 py-2.5 text-left transition-colors'
          return (
            <li key={g.path ?? g.name} className="min-w-0">
              {g.path ? (
                <button
                  type="button"
                  onClick={() => open(g.path!)}
                  aria-pressed={openPath === g.path}
                  title={`Open ${g.name}`}
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
