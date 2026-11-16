import type { ReactNode } from 'react'
import { LayoutTemplate } from 'lucide-react'

/** A quiet line in place of a surface: loading, removed, or from an older version. */
export function SurfaceNote({ children, pending = false }: { children: ReactNode; pending?: boolean }) {
  return (
    <div className="my-4 flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-fg-muted">
      <LayoutTemplate className="size-4 shrink-0" aria-hidden />
      <span className={pending ? 'shimmer' : undefined}>{children}</span>
    </div>
  )
}
