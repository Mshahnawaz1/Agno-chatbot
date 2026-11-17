/**
 * A2UI in the chat. The renderer (web_core, zod, signals) is large, so it loads only once a
 * reply has a surface; everything a message needs before that is in this file and its imports.
 */
import { lazy, Suspense } from 'react'
import { SurfaceNote } from './notes'

const SurfaceImpl = lazy(() => import('./Surface'))

export function Surface({ surfaceId }: { surfaceId: string }) {
  return (
    <Suspense fallback={<SurfaceNote pending>Building interface…</SurfaceNote>}>
      <SurfaceImpl surfaceId={surfaceId} />
    </Suspense>
  )
}

export function LegacySurface() {
  return <SurfaceNote>Interactive part from an earlier version of the app.</SurfaceNote>
}
