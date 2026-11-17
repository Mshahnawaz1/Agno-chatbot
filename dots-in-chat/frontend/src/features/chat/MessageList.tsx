import { useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react'
import { ArrowDown } from 'lucide-react'
import { IconButton } from '@/components/ui'
import type { Turn } from './chatStore'
import { Message } from './Message'

/** Auto-scroll keeps following the reply only while the user is this close to the bottom. */
const STICKY_PX = 120

export type MessageListHandle = {
  /** Jump to the bottom and resume following new content (used on send). */
  scrollToBottom: () => void
}

export function MessageList({
  turns,
  footer,
  ref,
}: {
  turns: Turn[]
  /** Rendered after the messages inside the scroll area (loading / error states). */
  footer?: ReactNode
  ref?: Ref<MessageListHandle>
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const stickRef = useRef(true)
  const [showJump, setShowJump] = useState(false)

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current
    if (!el) return
    stickRef.current = true
    setShowJump(false)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'auto' })
  }, [])

  useImperativeHandle(ref, () => ({ scrollToBottom: () => scrollToBottom() }), [scrollToBottom])

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickRef.current = distance <= STICKY_PX
    setShowJump(distance > STICKY_PX)
  }, [])

  // Content grows (tokens, history load, metrics panel): follow it if the user is near the bottom.
  useEffect(() => {
    const content = contentRef.current
    const el = scrollRef.current
    if (!content || !el) return
    const ro = new ResizeObserver(() => {
      if (stickRef.current) el.scrollTop = el.scrollHeight
      else setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > STICKY_PX)
    })
    ro.observe(content)
    return () => ro.disconnect()
  }, [])

  let lastAssistant = -1
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].role === 'assistant') {
      lastAssistant = i
      break
    }
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} onScroll={onScroll} className="h-full overflow-y-auto overflow-x-hidden">
        <div
          ref={contentRef}
          role="log"
          aria-label="Conversation"
          className="mx-auto flex w-full max-w-[768px] flex-col gap-6 px-4 pb-8 pt-4 sm:px-6"
        >
          {turns.map((t, i) => (
            <Message key={t.id} turn={t} isLast={i === lastAssistant} />
          ))}
          {footer}
        </div>
      </div>
      {showJump ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <IconButton
            aria-label="Scroll to bottom"
            variant="secondary"
            onClick={() => scrollToBottom(true)}
            className="pointer-events-auto rounded-full bg-surface-2 shadow-lg hover:bg-surface-3"
          >
            <ArrowDown className="size-4" aria-hidden />
          </IconButton>
        </div>
      ) : null}
    </div>
  )
}
