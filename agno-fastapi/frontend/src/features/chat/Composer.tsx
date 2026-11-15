import { useImperativeHandle, useLayoutEffect, useRef, type KeyboardEvent, type Ref } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import clsx from 'clsx'
import { Tooltip } from '@/components/ui'
import { MAX_MESSAGE_LENGTH } from './chatStore'

const MAX_HEIGHT = 200
const COUNTER_FROM = 3500

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  streaming,
  canSend = true,
  ref,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
  streaming: boolean
  /** False while the chat isn't ready (history still loading). */
  canSend?: boolean
  ref?: Ref<HTMLTextAreaElement>
}) {
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
  const sendDisabled = empty || tooLong || !canSend

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
      className={clsx(
        'flex items-end gap-2 rounded-3xl border bg-surface-2 py-2 pl-4 pr-2 transition-colors',
        'border-border focus-within:border-border-strong',
      )}
    >
      <textarea
        ref={innerRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder="Ask anything"
        aria-label="Message"
        aria-describedby={value.length > COUNTER_FROM ? 'composer-counter' : undefined}
        className="max-h-[200px] min-h-9 flex-1 resize-none bg-transparent py-1.5 text-base leading-6 text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:shadow-none"
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
    </form>
  )
}
