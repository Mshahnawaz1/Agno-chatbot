import { A2uiSurface } from '@a2ui/react/v0_9'
import { useSurfaceFeed } from './feed'
import { isSynced, useProcessor } from './processor'
import { SurfaceNote } from './notes'
import './a2ui.css'

/**
 * One surface, drawn where the agent created it. Its state lives in the chat's processor, so
 * a later turn's update shows here, and a deleteSurface leaves a short note in its place.
 */
export default function Surface({ surfaceId }: { surfaceId: string }) {
  const feed = useSurfaceFeed()
  const surface = useProcessor(feed).getSurface(surfaceId)
  if (!surface) {
    // Not applied yet (first frame) or deleted by a later turn.
    return isSynced(feed) ? <SurfaceNote>This interface was removed.</SurfaceNote> : null
  }
  return (
    // `dark` turns on shadcn's dark styles; inert while a reply streams (one run at a time).
    <div className="a2ui-host dark my-4" inert={feed.busy || undefined} aria-busy={feed.busy || undefined}>
      <A2uiSurface surface={surface} />
    </div>
  )
}
