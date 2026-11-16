import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { formatSeconds } from '@/lib/format'
import type { Metrics } from '@/lib/types'

const FIELDS: { key: keyof Metrics; label: string; format?: (v: number) => string }[] = [
  { key: 'input_tokens', label: 'Input tokens' },
  { key: 'output_tokens', label: 'Output tokens' },
  { key: 'total_tokens', label: 'Total tokens' },
  { key: 'time_to_first_token', label: 'Time to first token', format: formatSeconds },
  { key: 'duration', label: 'Duration', format: formatSeconds },
  { key: 'num_tools', label: 'Tool calls' },
]

const RESULT_LIMIT = 1000

function toText(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2) ?? ''
  } catch {
    return String(value)
  }
}

function Collapsible({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <details className="group/d rounded-md border border-border bg-bg/40">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-3 py-2 text-sm text-fg-muted hover:text-fg [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 shrink-0 transition-transform group-open/d:rotate-90" aria-hidden />
        {title}
      </summary>
      <div className="border-t border-border px-3 py-2">{children}</div>
    </details>
  )
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-fg-muted wrap-anywhere">
      {children}
    </pre>
  )
}

export function MetricsPanel({ metrics, id }: { metrics: Metrics; id?: string }) {
  const tools = Array.isArray(metrics.tools) ? metrics.tools : []
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tools: _tools, ...rest } = metrics
  const shown = FIELDS.filter((f) => metrics[f.key] != null)

  return (
    <div id={id} className="mt-2 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      {shown.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {shown.map(({ key, label, format }) => {
            const v = metrics[key]
            return (
              <div key={key} className="min-w-0">
                <dt className="text-xs text-fg-subtle">{label}</dt>
                <dd className="mt-0.5 font-mono text-sm text-fg">
                  {format ? format(Number(v)) : String(v)}
                </dd>
              </div>
            )
          })}
        </dl>
      ) : null}

      {tools.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Tool calls</p>
          {tools.map((t, i) => {
            const result = toText(t.result)
            const short = result.length > RESULT_LIMIT ? `${result.slice(0, RESULT_LIMIT)}…` : result
            return (
              <Collapsible key={i} title={<span className="truncate font-mono">{t.name || 'tool'}</span>}>
                <p className="mb-1 text-xs text-fg-subtle">Arguments</p>
                <Pre>{toText(t.args)}</Pre>
                <p className="mb-1 mt-3 text-xs text-fg-subtle">Result</p>
                <Pre>{short}</Pre>
              </Collapsible>
            )
          })}
        </div>
      ) : null}

      <Collapsible title="Raw metrics (JSON)">
        <Pre>{JSON.stringify(rest, null, 2)}</Pre>
      </Collapsible>
    </div>
  )
}
