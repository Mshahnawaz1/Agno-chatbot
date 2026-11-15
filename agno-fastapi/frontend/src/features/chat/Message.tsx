import { memo, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Check, CircleAlert, Copy, Info, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '@/components/ui'
import { Markdown } from '@/components/Markdown'
import type { Turn } from './chatStore'
import { MetricsPanel } from './MetricsPanel'

function Callout({ kind, message }: { kind: 'guardrail' | 'error'; message: string }) {
  const guardrail = kind === 'guardrail'
  const Icon = guardrail ? ShieldAlert : CircleAlert
  return (
    <div
      role="alert"
      className={clsx(
        'mt-3 flex gap-3 rounded-md border px-3.5 py-3 text-sm',
        guardrail ? 'border-warning/30 bg-warning/10' : 'border-danger/30 bg-danger/10',
      )}
    >
      <Icon className={clsx('mt-0.5 size-4 shrink-0', guardrail ? 'text-warning' : 'text-danger')} aria-hidden />
      <div className="min-w-0 wrap-anywhere">
        <p className={clsx('font-medium', guardrail ? 'text-warning' : 'text-danger')}>
          {guardrail ? 'Blocked by guardrail' : 'Something went wrong'}
        </p>
        <p className="mt-0.5 text-fg-muted">{message}</p>
      </div>
    </div>
  )
}

function ActionButton({
  onClick,
  children,
  pressed,
  controls,
}: {
  onClick: () => void
  children: ReactNode
  pressed?: boolean
  controls?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={controls ? pressed : undefined}
      aria-controls={controls}
      className={clsx(
        'inline-flex h-8 items-center gap-1.5 rounded-sm px-2 text-xs font-medium transition-colors',
        pressed ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

// A blinking block caret drawn after the last rendered markdown element while streaming.
const CARET = [
  "[&>*:last-child]:after:content-['']",
  '[&>*:last-child]:after:ml-0.5 [&>*:last-child]:after:inline-block [&>*:last-child]:after:h-[1.1em]',
  '[&>*:last-child]:after:w-2 [&>*:last-child]:after:translate-y-[0.2em] [&>*:last-child]:after:rounded-[2px]',
  '[&>*:last-child]:after:bg-fg [&>*:last-child]:after:caret-blink',
].join(' ')

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] whitespace-pre-wrap rounded-xl bg-surface-2 px-4 py-2.5 leading-7 text-fg wrap-anywhere">
        {content}
      </div>
    </div>
  )
}

function AssistantMessage({ turn, isLast }: { turn: Turn; isLast: boolean }) {
  const [copied, setCopied] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)
  const panelId = useId()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const streaming = turn.status === 'streaming'
  const thinking = streaming && turn.content === ''
  const finished = !streaming
  const hasActions = finished && (turn.content !== '' || turn.metrics != null)

  async function copy() {
    try {
      await navigator.clipboard.writeText(turn.content)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="group flex gap-3 sm:gap-4">
      <Logo size={24} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1" aria-live={streaming ? 'polite' : undefined} aria-busy={streaming || undefined}>
        {thinking ? (
          <p className="shimmer leading-7">Thinking…</p>
        ) : turn.content ? (
          <Markdown className={streaming ? CARET : undefined}>{turn.content}</Markdown>
        ) : null}

        {turn.status === 'stopped' ? (
          <p className="mt-2 text-xs text-fg-subtle">{turn.content ? 'Stopped' : 'Stopped before a reply'}</p>
        ) : null}

        {turn.error && turn.errorKind ? <Callout kind={turn.errorKind} message={turn.error} /> : null}

        {hasActions ? (
          <div
            className={clsx(
              'mt-2 -ml-2 flex items-center gap-0.5 transition-opacity',
              // Touch devices always show the row; hover devices reveal it on hover/focus.
              !isLast && !showMetrics && '[@media(hover:hover)]:opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
            )}
          >
            {turn.content ? (
              <ActionButton onClick={copy}>
                {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
              </ActionButton>
            ) : null}
            {turn.metrics ? (
              <ActionButton
                onClick={() => setShowMetrics((v) => !v)}
                pressed={showMetrics}
                controls={panelId}
              >
                <Info className="size-3.5" aria-hidden />
                Metrics
              </ActionButton>
            ) : null}
          </div>
        ) : null}

        {showMetrics && turn.metrics ? <MetricsPanel id={panelId} metrics={turn.metrics} /> : null}
      </div>
    </div>
  )
}

export const Message = memo(function Message({ turn, isLast }: { turn: Turn; isLast: boolean }) {
  return turn.role === 'user' ? <UserMessage content={turn.content} /> : <AssistantMessage turn={turn} isLast={isLast} />
})
