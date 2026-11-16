import { ArrowUp, CalendarClock, Check } from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '@/components/ui'

const TASKS = [
  { title: 'Review Q4 roadmap draft', when: '9:30 – 10:30', done: true },
  { title: 'Reply to design feedback', when: '11:00 – 11:30', done: false },
  { title: 'Deep work: API migration', when: '13:00 – 15:00', done: false },
]

/** A static, decorative mock of a chat turn with an interactive reply card. */
export function ChatPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        'pointer-events-none select-none overflow-hidden rounded-3xl border border-white/10 bg-surface/85 shadow-[0_-10px_60px_-10px_rgb(124_58_237/0.35)] backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span className="size-2.5 rounded-full bg-surface-3" />
        <span className="size-2.5 rounded-full bg-surface-3" />
        <span className="size-2.5 rounded-full bg-surface-3" />
        <span className="ml-3 text-xs text-fg-subtle">Plan my day</span>
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <p className="ml-auto max-w-[80%] rounded-3xl bg-surface-2 px-4 py-2.5 text-sm text-fg">
          Plan my day with Todoist and block time in Reclaim
        </p>

        <div className="flex gap-3">
          <Logo size={24} className="mt-0.5 shrink-0 self-start" />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-relaxed text-fg-muted">
              You have 3 tasks due today. I found open slots for each — confirm and I'll book them.
            </p>

            <div className="mt-4 rounded-2xl border border-border bg-bg/60 p-4">
              <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">
                <CalendarClock className="size-3.5" /> Today
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {TASKS.map((t) => (
                  <li key={t.title} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
                    <span
                      className={clsx(
                        'grid size-5 shrink-0 place-items-center rounded-md border',
                        t.done ? 'border-accent bg-accent text-white' : 'border-border-strong',
                      )}
                    >
                      {t.done ? <Check className="size-3.5" strokeWidth={3} /> : null}
                    </span>
                    <span className={clsx('min-w-0 flex-1 truncate text-sm', t.done ? 'text-fg-subtle line-through' : 'text-fg')}>
                      {t.title}
                    </span>
                    <span className="hidden font-mono text-xs text-fg-subtle sm:inline">{t.when}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <span className="inline-flex h-9 items-center rounded-full bg-white px-4 text-sm font-medium text-black">
                  Book in Reclaim
                </span>
                <span className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm text-fg-muted">
                  Adjust times
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-3xl border border-border bg-surface-2 py-2 pl-5 pr-2">
          <span className="flex-1 text-sm text-fg-subtle">Ask anything…</span>
          <span className="grid size-9 place-items-center rounded-full bg-white text-black">
            <ArrowUp className="size-4" />
          </span>
        </div>
      </div>
    </div>
  )
}
