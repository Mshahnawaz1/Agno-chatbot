import { useEffect, useState } from 'react'
import { Brain, Check, ChevronDown, CircleAlert, Copy, Plug, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { Markdown } from '@/components/Markdown'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shadcn/collapsible'
import { toolLabel, type Step, type ToolStep } from './activity'

type Status = 'running' | 'done' | 'failed'
type Tag = 'connecting' | 'reasoning' | 'tool_calling'

/** Four dots that pulse in turn while the agent works, and sit still once it is done. */
function Dots({ active }: { active: boolean }) {
  return (
    <span aria-hidden className="grid size-4 shrink-0 grid-cols-2 place-content-center gap-[3px]">
      {[0, 1, 3, 2].map((delay, i) => (
        <span
          key={i}
          style={active ? { animationDelay: `${delay * 0.15}s` } : undefined}
          className={clsx('size-[5px] rounded-full bg-accent', active ? 'dot-pulse' : 'opacity-70')}
        />
      ))}
    </span>
  )
}

function duration(ms: number): string {
  if (ms < 1000) return `${Math.max(0, Math.round(ms / 100) * 100)}ms`
  const s = Math.round(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

/** A running timer: whole seconds, then minutes ("0s", "42s", "1m 05s"). */
function clock(ms: number): string {
  const s = Math.floor(ms / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

/** Current time, ticking while `active` so running steps show a live duration. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [active])
  return now
}

function pretty(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function Detail({ title, text }: { title: string; text: string }) {
  if (!text.trim() || text === '{}') return null
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">{title}</p>
      <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-surface-2 px-2.5 py-2 font-mono text-xs leading-5 text-fg-muted wrap-anywhere">
        {text}
      </pre>
    </div>
  )
}

const TONE: Record<Status, { ring: string; text: string }> = {
  done: { ring: 'border-success/70 text-success', text: 'text-success' },
  running: { ring: 'border-warning/70 text-warning', text: 'text-warning' },
  failed: { ring: 'border-danger/70 text-danger', text: 'text-danger' },
}

/** Round status mark: a tick when done, a pulsing dot while running, a cross on failure. */
function Mark({ status }: { status: Status }) {
  return (
    <span className={clsx('grid size-6 shrink-0 place-content-center rounded-full border', TONE[status].ring)}>
      {status === 'done' ? <Check className="size-3.5" aria-hidden /> : null}
      {status === 'failed' ? <X className="size-3.5" aria-hidden /> : null}
      {status === 'running' ? <span className="size-2 animate-pulse rounded-full bg-warning" aria-hidden /> : null}
    </span>
  )
}

/** One step: status mark, the step's icon and label in the status colour, tag and duration. */
function Row({
  icon: Icon, status, tag, label, ms, children,
}: {
  icon: LucideIcon
  status: Status
  tag: Tag
  label: string
  ms: number | null
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const expandable = !!children
  const head = (
    <span className="flex min-w-0 flex-1 items-center gap-2.5">
      <Mark status={status} />
      <Icon className={clsx('size-4 shrink-0', TONE[status].text)} aria-hidden />
      <span className={clsx('min-w-0 truncate text-[15px] font-medium', TONE[status].text, status === 'running' && 'shimmer')}>{label}</span>
      <span className="hidden shrink-0 rounded bg-surface-2 px-1.5 py-px font-mono text-[10.5px] text-fg-subtle sm:inline">{tag}</span>
      <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-fg-subtle">
        {ms !== null ? duration(ms) : null}
        {expandable ? (
          <ChevronDown className="size-4 transition-transform duration-200 group-aria-expanded/row:rotate-180" aria-hidden />
        ) : null}
      </span>
    </span>
  )
  return (
    <li className="step-in">
      {expandable ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="group/row flex w-full min-w-0 cursor-pointer items-center rounded-md py-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            {head}
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            <div className="mb-1 ml-[34px] mt-1 flex flex-col gap-2">{children}</div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="flex py-1.5">{head}</div>
      )}
    </li>
  )
}

/** A reasoning step as its own panel, with a copy button, like the reference. */
function ReasoningCard({ text, live, ms }: { text: string; live: boolean; ms: number | null }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }
  return (
    <li className="step-in rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-accent-2">
        <Brain className={clsx('size-4', live && 'animate-pulse')} aria-hidden />
        Reasoning
        <span className="hidden rounded bg-surface-2 px-1.5 py-px font-mono text-[10.5px] font-normal text-fg-subtle sm:inline">reasoning</span>
        {ms !== null ? <span className="text-xs font-normal tabular-nums text-fg-subtle">{duration(ms)}</span> : null}
        <button
          type="button"
          onClick={copy}
          className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-normal text-fg-subtle transition-colors hover:text-fg"
        >
          {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <Markdown className="mt-2 min-w-0 text-[14px] leading-6 text-fg-muted [&_p]:leading-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {text}
      </Markdown>
    </li>
  )
}

function ToolItem({ step, now }: { step: ToolStep; now: number }) {
  const label = toolLabel(step.name, step.args)
  const status: Status = step.status === 'error' ? 'failed' : step.status
  const hasDetail = Object.keys(step.args).length > 0 || !!step.result
  const ms = step.startedAt ? (step.endedAt ?? now) - step.startedAt : null
  return (
    <Row
      icon={step.status === 'error' ? CircleAlert : label.icon}
      status={status}
      tag="tool_calling"
      label={status === 'running' ? label.running : label.done}
      ms={ms}
    >
      {hasDetail ? (
        <>
          <Detail title="Input" text={pretty(step.args)} />
          <Detail title="Output" text={step.result ?? ''} />
        </>
      ) : null}
    </Row>
  )
}

/**
 * What the agent is doing, as a collapsible timeline: connecting, then each reasoning and
 * tool-calling step in order, each with its icon, status and duration. Open while working,
 * closed once the answer starts; a click wins over both.
 */
export function Activity({
  steps, running, startedAt, workMs,
}: {
  steps: Step[]
  running: boolean
  startedAt: number | null
  workMs: number | null
}) {
  const [open, setOpen] = useState<boolean | undefined>(undefined)
  const now = useNow(running)
  const total = running ? (startedAt === null ? null : Math.max(0, now - startedAt)) : workMs

  // Connecting lasts until the first step (or the end of the work when nothing else happened).
  const firstAt = steps[0]?.startedAt
  const connectMs =
    startedAt === null ? null : firstAt ? firstAt - startedAt : running ? now - startedAt : (workMs ?? null)
  const connecting = running && !steps.length

  const count = steps.length + 1

  return (
    <Collapsible open={open ?? running} onOpenChange={setOpen} className="mb-3">
      <CollapsibleTrigger className="group flex h-7 w-fit max-w-full cursor-pointer items-center gap-2.5 rounded-lg border border-border-strong bg-surface px-3 text-left outline-none transition-colors hover:border-accent-2/60 focus-visible:ring-3 focus-visible:ring-ring/50">
        <Dots active={running} />
        <span className="shrink-0 text-sm font-semibold text-fg">Thinking &amp; Actions</span>
        <span className={clsx('shrink-0 text-sm', running ? 'text-accent-2' : 'text-success')}>
          <span className={running ? 'shimmer' : undefined}>{running ? 'Working…' : 'Done'}</span>
        </span>
        {total !== null ? (
          <span className={clsx('shrink-0 text-xs font-medium tabular-nums', running ? 'text-accent-2' : 'text-fg-subtle')}>
            {running ? clock(total) : duration(total)}
          </span>
        ) : null}
        <span className="shrink-0 rounded-md bg-surface-2 px-2 text-xs font-semibold leading-5 tabular-nums text-fg-muted">
          {count} {count === 1 ? 'step' : 'steps'}
        </span>
        <ChevronDown className="size-4 shrink-0 text-fg-muted transition-transform duration-200 group-aria-expanded:rotate-180" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="mt-2 max-h-[28rem] max-w-xl overflow-y-auto rounded-2xl border border-border bg-bg p-3">
          <ol className="flex flex-col gap-1">
            <Row
              icon={Plug}
              status={connecting ? 'running' : 'done'}
              tag="connecting"
              label={connecting ? 'Connecting to provider' : 'Connected to provider'}
              ms={connectMs}
            />
            {steps.map((s, i) => {
              const live = running && i === steps.length - 1 && !s.endedAt
              return s.kind === 'thought' ? (
                <ReasoningCard key={s.id} text={s.text} live={live} ms={s.startedAt ? (s.endedAt ?? now) - s.startedAt : null} />
              ) : (
                <ToolItem key={s.id} step={s} now={now} />
              )
            })}
          </ol>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
