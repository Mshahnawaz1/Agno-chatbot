import clsx from 'clsx'
import { BookOpenText } from 'lucide-react'
import type { Source } from '@/lib/types'
import { useFilePanelContext } from '@/features/files/useFilePanel'

function where(s: Source): string {
  const parts = []
  if (s.page != null) parts.push(`Page ${s.page}`)
  if (s.chunk != null) parts.push(`Chunk ${s.chunk}`)
  return parts.join(' · ')
}

/** What the reply was based on: one card per knowledge-base chunk; a click opens its file in the panel. */
export function SourceCards({ sources }: { sources: Source[] }) {
  const { path: openPath, open } = useFilePanelContext()
  return (
    <section aria-label="Sources" className="mt-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
        <BookOpenText className="size-3.5" aria-hidden />
        Sources
      </p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {sources.map((s, i) => {
          const body = (
            <>
              <span className="block truncate text-sm font-medium text-fg">{s.name}</span>
              <span className="block text-xs text-fg-subtle">{where(s)}</span>
              <span className="mt-1.5 line-clamp-4 block text-xs leading-5 text-fg-muted">{s.snippet}</span>
            </>
          )
          const base = 'flex h-full w-full flex-col items-stretch justify-start rounded-md border px-3 py-2.5 text-left transition-colors'
          return (
            <li key={`${s.name}:${s.page}:${s.chunk}:${i}`} className="min-w-0">
              {s.path ? (
                <button
                  type="button"
                  onClick={() => open(s.path!)}
                  aria-pressed={openPath === s.path}
                  title={`Open ${s.name}`}
                  className={clsx(
                    base,
                    openPath === s.path
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
