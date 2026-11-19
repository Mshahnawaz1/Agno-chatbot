import { useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUp, Square } from 'lucide-react'
import clsx from 'clsx'
import { Tooltip } from '@/components/ui'
import * as api from '@/lib/api'
import type { FileEntry } from '@/lib/types'
import { MAX_MESSAGE_LENGTH } from './chatStore'
import { MentionMenu } from './MentionMenu'
import { AttachButton, AttachmentChip } from './Attach'
import { MAX_ATTACHMENTS, type Attached } from './attachments'

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

  // "@" mention: an @ at the start of a word, up to the caret, opens the artifact list.
  const menuId = useId()
  const [mention, setMention] = useState<{ start: number; end: number; query: string } | null>(null)
  const [active, setActive] = useState(0)
  const files = useQuery({ queryKey: ['files'], queryFn: api.listFiles, enabled: mention !== null })
  const matches = useMemo(() => {
    if (!mention) return []
    const q = mention.query.toLowerCase()
    return [...(files.data ?? [])]
      .filter((f) => f.name.toLowerCase().includes(q))
      .sort((a, b) => b.modified.localeCompare(a.modified))
  }, [files.data, mention])
  const menuOpen = mention !== null
  const chosen = useMemo(() => new Set(attached.map((a) => a.path)), [attached])

  function detect(text: string, caret: number) {
    const m = /(^|\s)@([^\s@]*)$/.exec(text.slice(0, caret))
    const next = m ? { start: caret - m[2].length - 1, end: caret, query: m[2] } : null
    setMention(next)
    if (next?.query !== mention?.query) setActive(0)
  }

  function pickMention(f: FileEntry) {
    if (!mention) return
    const el = innerRef.current
    const next = value.slice(0, mention.start) + value.slice(mention.end)
    onChange(next)
    setMention(null)
    if (!chosen.has(f.path) && chosen.size < MAX_ATTACHMENTS) onPick(f)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(mention.start, mention.start)
    })
  }

  const empty = value.trim() === ''
  const tooLong = value.length > MAX_MESSAGE_LENGTH
  // Files alone are a message: the page fills in the words.
  const sendDisabled = (empty && attached.length === 0) || tooLong || !canSend || uploading

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (menuOpen && !e.nativeEvent.isComposing) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setMention(null)
        return
      }
      if (matches.length) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault()
          setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length)
          return
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          pickMention(matches[Math.min(active, matches.length - 1)])
          return
        }
      }
    }
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
        'glass relative flex flex-col rounded-3xl transition-colors',
        'shadow-[0_-10px_60px_-10px_rgb(124_58_237/0.3)] focus-within:border-white/20',
        dragging && 'border-accent',
      )}
    >
      {menuOpen ? (
        <MentionMenu
          id={menuId}
          items={matches}
          active={Math.min(active, Math.max(matches.length - 1, 0))}
          chosen={chosen}
          loading={files.isPending}
          onSelect={pickMention}
          onHover={setActive}
        />
      ) : null}
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
          onChange={(e) => {
            onChange(e.target.value)
            detect(e.target.value, e.target.selectionStart)
          }}
          onKeyDown={onKeyDown}
          onKeyUp={(e) => {
            // Caret moved by the arrows/Home/End without typing: re-check (up/down belong to the menu).
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End')
              detect(e.currentTarget.value, e.currentTarget.selectionStart)
          }}
          onClick={(e) => detect(e.currentTarget.value, e.currentTarget.selectionStart)}
          onBlur={() => setMention(null)}
          role="combobox"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={menuOpen && matches.length ? `${menuId}-${Math.min(active, matches.length - 1)}` : undefined}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={dragging ? 'Drop files to attach' : 'Ask anything, or @ to add an artifact'}
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
