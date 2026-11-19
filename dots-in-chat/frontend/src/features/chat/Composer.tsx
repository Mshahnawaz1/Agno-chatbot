import { useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import clsx from 'clsx'
import { Tooltip } from '@/components/ui'
import { MAX_MESSAGE_LENGTH } from './chatStore'
import { AttachButton, AttachmentChip } from './Attach'
import type { Attached } from './attachments'

const MAX_HEIGHT = 200
const COUNTER_FROM = 3500

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  streaming,
  canSend = true,
  attached,
  uploading,
  attachError,
  onUpload,
  onPick,
  onRemove,
  ref,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
  streaming: boolean
  /** False while the chat isn't ready (history still loading). */
  canSend?: boolean
  attached: Attached[]
  uploading: boolean
  attachError: string | null
  onUpload: (files: File[]) => void
  onPick: (file: Attached) => void
  onRemove: (path: string) => void
  ref?: Ref<HTMLTextAreaElement>
}) {
  const [dragging, setDragging] = useState(false)
  const innerRef = useRef<HTMLTextAreaElement | null>(null)

  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, [])

  // Autosize: shrink to content, cap at MAX_HEIGHT and scroll beyond it.
  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [value])

  const empty = value.trim() === ''
  const tooLong = value.length > MAX_MESSAGE_LENGTH
  // Files alone are a message: the page fills in the words.
  const sendDisabled = (empty && attached.length === 0) || tooLong || !canSend || uploading

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // keyCode 229: some IMEs (Safari) report the confirming Enter this way instead of isComposing.
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || e.keyCode === 229) return
    e.preventDefault()
    if (!streaming && !sendDisabled) onSubmit()
  }

  const button = streaming ? (
    <button
      type="button"
      onClick={onStop}
      aria-label="Stop generating"
      className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black transition-colors hover:bg-white/90"
    >
      <Square className="size-3.5 fill-current" aria-hidden />
    </button>
  ) : (
    <button
      type="submit"
      disabled={sendDisabled}
      aria-label="Send message"
      className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-fg-subtle"
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!streaming && !sendDisabled) onSubmit()
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return
        e.preventDefault()
        setDragging(false)
        onUpload(Array.from(e.dataTransfer.files))
      }}
      className={clsx(
        'glass flex flex-col rounded-3xl transition-colors',
        'shadow-[0_-10px_60px_-10px_rgb(124_58_237/0.3)] focus-within:border-white/20',
        dragging && 'border-accent',
      )}
    >
      {attached.length ? (
        <ul aria-label="Attached files" className="flex flex-wrap gap-2 px-4 pt-3">
          {attached.map((a) => (
            <li key={a.path} className="min-w-0 max-w-full">
              <AttachmentChip file={a} onRemove={() => onRemove(a.path)} />
            </li>
          ))}
        </ul>
      ) : null}
      {attachError ? (
        <p role="alert" className="px-5 pt-2 text-xs text-danger">
          {attachError}
        </p>
      ) : null}
      <div className="flex items-end gap-1 py-2 pl-2 pr-2">
        <AttachButton attached={attached} uploading={uploading} onUpload={onUpload} onPick={onPick} />
        <textarea
          ref={innerRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={dragging ? 'Drop files to attach' : 'Ask anything'}
          aria-label="Message"
          aria-describedby={value.length > COUNTER_FROM ? 'composer-counter' : undefined}
          className="max-h-[200px] min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-base leading-6 text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:shadow-none"
        />
        <div className="flex shrink-0 items-center gap-2 self-end">
          {value.length > COUNTER_FROM ? (
            <span
              id="composer-counter"
              className={clsx(
                'font-mono text-xs tabular-nums',
                value.length >= MAX_MESSAGE_LENGTH ? 'text-danger' : 'text-fg-subtle',
              )}
            >
              {value.length}/{MAX_MESSAGE_LENGTH}
            </span>
          ) : null}
          <Tooltip content={streaming ? 'Stop' : 'Send'}>{button}</Tooltip>
        </div>
      </div>
    </form>
  )
}
