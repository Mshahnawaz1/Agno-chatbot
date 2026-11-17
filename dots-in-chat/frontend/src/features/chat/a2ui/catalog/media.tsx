/** Media and overlay components of the basic catalog: Video, AudioPlayer, Modal. */
import { useState } from 'react'
import { AudioPlayerApi, ModalApi, VideoApi } from '@a2ui/web_core/catalogs/basic/v1'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { weightStyle } from './props'

export const Video = createComponentImplementation(VideoApi, ({ props }) => (
  <video
    controls
    preload="metadata"
    src={props.url ?? undefined}
    poster={props.posterUrl ?? undefined}
    style={weightStyle(props.weight)}
    className="a2ui-video max-h-96 w-full rounded-xl bg-black"
  />
))

export const AudioPlayer = createComponentImplementation(AudioPlayerApi, ({ props }) => (
  <figure style={weightStyle(props.weight)} className="a2ui-audio flex flex-col gap-1">
    {props.description ? <figcaption className="text-sm text-fg-muted">{props.description}</figcaption> : null}
    <audio controls preload="metadata" src={props.url ?? undefined} className="w-full" />
  </figure>
))

/** The trigger is drawn in place; activating it opens the content in a dialog. */
export const Modal = createComponentImplementation(ModalApi, ({ props, buildChild }) => {
  const [open, setOpen] = useState(false)
  return (
    <div style={weightStyle(props.weight)} className="a2ui-modal">
      <div onClick={() => setOpen(true)}>{props.trigger ? buildChild(props.trigger) : null}</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Details" hideTitle>
          {props.content ? buildChild(props.content) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
})
