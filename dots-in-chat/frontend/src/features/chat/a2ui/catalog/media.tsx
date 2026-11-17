/** Media components of the basic catalog: Modal, Video, AudioPlayer. */
import { useState } from 'react'
import { AudioPlayerApi, ModalApi, VideoApi } from '@a2ui/web_core/v1_0'
import { Dialog, DialogContent } from '@/components/ui'
import { implement } from './aria'
import { weightStyle } from './props'

/** The trigger child opens a dialog that shows the content child. */
export const Modal = implement(ModalApi, ({ props, buildChild }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div style={weightStyle(props.weight)} className="a2ui-modal-trigger self-start" onClick={() => setOpen(true)}>
        {props.trigger ? buildChild(props.trigger) : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Details" hideTitle>
          {props.content ? buildChild(props.content) : null}
        </DialogContent>
      </Dialog>
    </>
  )
})

export const Video = implement(VideoApi, ({ props }) =>
  props.url ? (
    <video
      src={props.url}
      poster={props.posterUrl || undefined}
      controls
      preload="metadata"
      style={weightStyle(props.weight)}
      className="a2ui-video max-h-96 w-full rounded-xl bg-black"
    />
  ) : null,
)

export const AudioPlayer = implement(AudioPlayerApi, ({ props }) =>
  props.url ? (
    <figure style={weightStyle(props.weight)} className="a2ui-audio flex min-w-0 flex-col gap-1.5">
      {props.description ? <figcaption className="text-sm text-fg-muted">{props.description}</figcaption> : null}
      <audio src={props.url} controls preload="metadata" aria-label={props.description || undefined} className="w-full" />
    </figure>
  ) : null,
)
