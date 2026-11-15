import { memo, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, CircleAlert, Copy, Info, MousePointerClick, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '@/components/ui'
import { Markdown } from '@/components/Markdown'
import type { Turn } from './chatStore'
import { MetricsPanel } from './MetricsPanel'
import { A2uiBlock, A2uiPending } from './a2ui'
import { parseAction, parseSegments, textOnly, trimPartialTag, type UiAction } from './a2ui/parse'

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

function summarize(value: unknown): string {
  if (value == null || value === '') return '—'
  if (Array.isArray(value)) return value.map(summarize).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** A click on an A2UI surface, shown as what was chosen rather than as raw protocol. */
function ActionMessage({ action }: { action: UiAction }) {
  const entries = Object.entries(action.context ?? {})
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-fg wrap-anywhere">
        <p className="flex items-center gap-1.5 font-medium">
          <MousePointerClick className="size-3.5 shrink-0 text-accent" aria-hidden />
          {action.name.replace(/[_-]+/g, ' ')}
        </p>
        {entries.length ? (
          <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-fg-muted">
            {entries.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-fg-subtle">{k}</dt>
                <dd className="min-w-0">{summarize(v)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  )
}

/** Markdown and A2UI blocks, in reply order. */
function ReplyBody({ content, streaming }: { content: string; streaming: boolean }) {
  const segments = useMemo(() => parseSegments(content), [content])
  return segments.map((seg, i) => {
    const last = i === segments.length - 1
    if (seg.kind === 'ui') return <A2uiBlock key={seg.key} raw={seg.raw} />
    if (seg.kind === 'pending') return streaming ? <A2uiPending key="pending" /> : null
    const text = streaming && last ? trimPartialTag(seg.text) : seg.text
    return text ? <Markdown key={`t${i}`} className={streaming && last ? CARET : undefined}>{text}</Markdown> : null
  })
}

function UserMessage({ content }: { content: string }) {
  const action = useMemo(() => parseAction(content), [content])
  if (action) return <ActionMessage action={action} />
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
      await navigator.clipboard.writeText(textOnly(turn.content))
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
          <ReplyBody content={turn.content} streaming={streaming} />
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
