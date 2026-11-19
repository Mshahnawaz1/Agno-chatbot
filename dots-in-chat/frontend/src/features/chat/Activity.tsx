import { useEffect, useState } from 'react'
import { Brain, ChevronRight, CircleAlert, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { Markdown } from '@/components/Markdown'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shadcn/collapsible'
import { toolLabel, type Step, type ToolStep } from './activity'

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

function seconds(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

/** Seconds since `since`, ticking once a second while `running`. */
function useElapsed(since: number | null, running: boolean): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running || since === null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running, since])
  return since === null ? null : Math.max(0, now - since)
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

function ToolRow({ step }: { step: ToolStep }) {
  const [open, setOpen] = useState(false)
  const label = toolLabel(step.name, step.args)
  const running = step.status === 'running'
  const Icon = step.status === 'error' ? CircleAlert : label.icon
  const hasDetail = Object.keys(step.args).length > 0 || !!step.result
  const line = (
    <span className="flex min-w-0 items-center gap-2">
      {running ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-fg-subtle" aria-hidden />
      ) : (
        <Icon className={clsx('size-3.5 shrink-0', step.status === 'error' ? 'text-danger' : 'text-fg-subtle')} aria-hidden />
      )}
      <span className={clsx('min-w-0 truncate', running && 'shimmer', step.status === 'error' && 'text-danger')}>
        {running ? label.running : label.done}
      </span>
      {hasDetail ? (
        <ChevronRight
          className={clsx('size-3.5 shrink-0 text-fg-subtle transition-transform duration-200', open && 'rotate-90')}
          aria-hidden
        />
      ) : null}
    </span>
  )
  if (!hasDetail) return <div className="step-in py-1 text-sm text-fg-muted">{line}</div>
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="step-in">
      <CollapsibleTrigger className="flex w-fit max-w-full cursor-pointer py-1 text-left text-sm text-fg-muted transition-colors hover:text-fg">
        {line}
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="mb-1 mt-1 flex flex-col gap-2 pl-5">
          <Detail title="Input" text={pretty(step.args)} />
          <Detail title="Output" text={step.result ?? ''} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ThoughtRow({ text, live }: { text: string; live: boolean }) {
  return (
    <div className="step-in flex min-w-0 gap-2 py-1 text-sm text-fg-muted">
      <Brain className={clsx('mt-1 size-3.5 shrink-0 text-fg-subtle', live && 'animate-pulse')} aria-hidden />
      <Markdown className="min-w-0 text-[13px] leading-5 text-fg-muted [&_p]:leading-5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{text}</Markdown>
    </div>
  )
}

/**
 * What the agent is doing, like Claude's activity list: a header ("Running a command · 30s") that
 * collapses, and under it each thought and tool call in order. Open while working, closed once the
 * answer starts; a click wins over both.
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
  const elapsed = useElapsed(startedAt, running)
  const current = [...steps].reverse().find((s): s is ToolStep => s.kind === 'tool' && s.status === 'running')
  const tools = steps.filter((s) => s.kind === 'tool').length

  let title: string
  if (running) title = current ? toolLabel(current.name, current.args).running : steps.at(-1)?.kind === 'thought' ? 'Thinking' : 'Working'
  else if (tools) title = `Used ${tools} ${tools === 1 ? 'tool' : 'tools'}`
  else title = 'Thought'
  const time = running ? elapsed : workMs

  return (
    <Collapsible open={open ?? running} onOpenChange={setOpen} className="mb-3">
      <CollapsibleTrigger className="group flex w-fit max-w-full cursor-pointer items-center gap-2.5 rounded-md text-left text-[15px] text-fg-muted transition-colors outline-none hover:text-fg focus-visible:ring-3 focus-visible:ring-ring/50">
        <Dots active={running} />
        <span className={clsx('min-w-0 truncate', running && 'shimmer')}>{title}</span>
        {time !== null && time >= 1000 ? <span className="shrink-0 tabular-nums text-fg-subtle">{seconds(time)}</span> : null}
        <ChevronRight className="size-3.5 shrink-0 text-fg-subtle transition-transform duration-200 group-aria-expanded:rotate-90" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="mb-1 ml-2 mt-2 max-h-96 overflow-y-auto border-l border-border pl-5">
          {steps.map((s, i) =>
            s.kind === 'thought' ? (
              <ThoughtRow key={s.id} text={s.text} live={running && i === steps.length - 1} />
            ) : (
              <ToolRow key={s.id} step={s} />
            ),
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
