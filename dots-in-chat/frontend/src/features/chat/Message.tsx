import { memo, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Brain, Check, CircleAlert, Copy, Info, MousePointerClick, ShieldAlert } from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '@/components/ui'
import { Markdown } from '@/components/Markdown'
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/components/shadcn/trace'
import type { Turn } from './chatStore'
import { MetricsPanel } from './MetricsPanel'
import { LegacySurface, Surface } from './a2ui'
import { createdSurfaceId, type Part, type UiAction } from './a2ui/protocol'

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

/** Text and surfaces, in reply order. A surface is drawn where it was created; later messages
 *  for it (updates, deletes) change it in place, so they draw nothing here. */
function ReplyBody({ parts, streaming }: { parts: Part[]; streaming: boolean }) {
  return parts.map((part, i) => {
    if (part.kind === 'legacy') return <LegacySurface key={i} />
    if (part.kind === 'a2ui') {
      const id = createdSurfaceId(part.message)
      return id ? <Surface key={`s:${id}`} surfaceId={id} /> : null
    }
    const caret = streaming && i === parts.length - 1
    return part.text.trim() ? (
      <Markdown key={i} className={caret ? CARET : undefined}>
        {part.text}
      </Markdown>
    ) : null
  })
}

function formatThinkTime(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000))
  return s < 60 ? `for ${s}s` : `for ${Math.floor(s / 60)}m ${s % 60}s`
}

/**
 * The model's thoughts, as shadcn's Reasoning pattern (a Trace row that collapses):
 * open while the model is thinking, closed once the answer starts. A click wins over both.
 * https://ui.shadcn.com/docs/ai-elements/aria/reasoning
 */
function Reasoning({ text, running, ms }: { text: string; running: boolean; ms: number | null }) {
  const [open, setOpen] = useState<boolean | undefined>(undefined)
  return (
    <Trace className="mb-3">
      <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
        <TraceCollapsibleTrigger>
          <TraceLine status={running ? 'running' : undefined}>
            <TraceIcon>
              <Brain />
            </TraceIcon>
            <TraceTitle>{running ? 'Thinking' : 'Thought'}</TraceTitle>
            {!running && ms !== null ? <TraceDescription>{formatThinkTime(ms)}</TraceDescription> : null}
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="max-h-80 overflow-y-auto text-sm">
          <Markdown className="text-sm text-fg-muted">{text}</Markdown>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  )
}

function UserMessage({ turn }: { turn: Turn }) {
  // A tapped suggestion reads as what the user said.
  const said = turn.action?.name === 'say' ? turn.action.context?.text : undefined
  if (turn.action && typeof said !== 'string') return <ActionMessage action={turn.action} />
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] whitespace-pre-wrap rounded-xl bg-surface-2 px-4 py-2.5 leading-7 text-fg wrap-anywhere">
        {typeof said === 'string' ? said : turn.content}
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
  const hasReasoning = turn.reasoning.trim() !== ''
  const thinking = streaming && turn.parts.length === 0 && !hasReasoning
  // Thinking until the answer starts (the provider then records reasoningMs) or the turn ends.
  const reasoningRunning = streaming && turn.reasoningMs === null && turn.parts.length === 0
  const finished = !streaming
  const hasActions = finished && (turn.content.trim() !== '' || turn.metrics != null)

  async function copy() {
    try {
      await navigator.clipboard.writeText(turn.content.trim())
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="group flex gap-3 sm:gap-4">
      <Logo size={24} className="mt-0.5 shrink-0 self-start" />
      <div className="min-w-0 flex-1" aria-live={streaming ? 'polite' : undefined} aria-busy={streaming || undefined}>
        {hasReasoning ? <Reasoning text={turn.reasoning} running={reasoningRunning} ms={turn.reasoningMs} /> : null}
        {thinking ? (
          <p className="shimmer leading-7">Thinking…</p>
        ) : (
          <ReplyBody parts={turn.parts} streaming={streaming} />
        )}

        {turn.status === 'stopped' ? (
          <p className="mt-2 text-xs text-fg-subtle">{turn.parts.length ? 'Stopped' : 'Stopped before a reply'}</p>
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
            {turn.content.trim() ? (
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
  return turn.role === 'user' ? <UserMessage turn={turn} /> : <AssistantMessage turn={turn} isLast={isLast} />
})
