import { lazy, Suspense } from 'react'
import { LayoutTemplate } from 'lucide-react'

// The renderer (lit, zod, markdown-it) is most of a megabyte: load it only for replies with UI.
const A2uiBlockImpl = lazy(() => import('./A2uiBlock'))

/** Placeholder while a block streams in (its JSON is useless until complete) or loads. */
export function A2uiPending() {
  return (
    <div className="my-4 flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-fg-muted">
      <LayoutTemplate className="size-4 shrink-0" aria-hidden />
      <span className="shimmer">Building interface…</span>
    </div>
  )
}

export function A2uiBlock({ raw }: { raw: string }) {
  return (
    <Suspense fallback={<A2uiPending />}>
      <A2uiBlockImpl raw={raw} />
    </Suspense>
  )
}
