/**
 * BatchSend: several follow-up messages the agent drafted, one row per person.
 *
 * A round check takes a person out of the batch (or puts them back); a tap on the row's text
 * opens that person's message in a textarea to read or edit. The primary button sends only the
 * selected people, with any edits, as `send_batch`. "Not now" sends `dismiss_batch`. Nothing
 * goes out until the user taps the primary button.
 */
import { useState } from 'react'
import { z } from 'zod'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Check } from 'lucide-react'
import { Action, Actions, Block, Done, Footnote, Pill } from './kit'
import { useLive, useSend } from './hooks'
import { cn } from '@/lib/utils'

const BatchSendApi = {
  name: 'BatchSend',
  schema: z.object({
    people: z
      .array(
        z.object({
          name: z.string().describe('The person\'s name, e.g. "Priya Sharma".'),
          detail: z.string().optional().describe('When they were last messaged, e.g. "45 days ago".'),
          message: z.string().describe('The follow-up drafted for them.'),
        }),
      )
      .describe('One entry per person due a follow-up.'),
    action: z.string().optional().describe('The verb on the send button. Defaults to "Send".'),
  }),
}

type Person = { name: string; detail?: string; message: string; included: boolean }
type Result = { kind: 'sent'; count: number } | { kind: 'dismissed' } | null

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const personCount = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`

export const BatchSend = createComponentImplementation(BatchSendApi, ({ props, context }) => {
  const send = useSend(context)
  const live = useLive<{ people: Person[] }>(context, {
    people: props.people.map((p) => ({ ...p, included: true })),
  })
  const people = live.value.people
  const selected = people.filter((p) => p.included)
  const k = selected.length
  const [open, setOpen] = useState<number | null>(null)
  const [result, setResult] = useState<Result>(null)
  const locked = result !== null

  const update = (i: number, patch: Partial<Person>) =>
    live.set((s) => ({ people: s.people.map((p, j) => (j === i ? { ...p, ...patch } : p)) }))

  return (
    <Block
      badges={
        <>
          <Pill tone="accent">{plural(people.length, 'follow-up')}</Pill>
          <Pill tone="warn">{`Reaches ${personCount(k)}`}</Pill>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {people.map((p, i) => (
          <div
            key={`${p.name}-${i}`}
            className={cn('blk-inset flex items-start gap-3 p-3', !p.included && 'opacity-50')}
          >
            <button
              type="button"
              aria-pressed={p.included}
              aria-label={`Include ${p.name}`}
              disabled={locked}
              onClick={() => update(i, { included: !p.included })}
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed',
                p.included
                  ? 'border-transparent bg-[var(--blk-accent)] text-white'
                  : 'border-[var(--blk-subtle)] text-transparent',
              )}
            >
              {p.included && <Check className="size-3" strokeWidth={3} aria-hidden />}
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <button
                type="button"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
                className="flex min-w-0 flex-col items-start gap-0.5 text-left"
              >
                <span className="text-sm font-medium text-[var(--blk-text)]">{p.name}</span>
                {p.included ? (
                  <span className="blk-sub w-full truncate">
                    {p.detail ? `${p.detail} · ` : ''}“{p.message}”
                  </span>
                ) : (
                  <span className="blk-foot">Removed from this batch</span>
                )}
              </button>
              {open === i && (
                <textarea
                  aria-label={`Message to ${p.name}`}
                  value={p.message}
                  disabled={locked}
                  onChange={(e) => update(i, { message: e.target.value })}
                  rows={4}
                  className="mt-1 w-full resize-y rounded-[0.875rem] border border-[var(--blk-inset-border)] bg-[var(--blk-card)] px-3 py-2.5 text-sm leading-relaxed text-[var(--blk-text)] outline-none focus-visible:border-[var(--blk-accent-hi)] disabled:opacity-60"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {result === null ? (
        <Actions>
          <Action
            variant="primary"
            disabled={k === 0}
            onClick={() => {
              send('send_batch', {
                people: selected.map((p) => ({ name: p.name, message: p.message })),
              })
              setResult({ kind: 'sent', count: k })
            }}
          >
            {`${props.action ?? 'Send'} ${plural(k, 'message')}`}
          </Action>
          <Action
            variant="ghost"
            onClick={() => {
              send('dismiss_batch', {})
              setResult({ kind: 'dismissed' })
            }}
          >
            Not now
          </Action>
        </Actions>
      ) : result.kind === 'sent' ? (
        <Done>✓ Sent {plural(result.count, 'message')}</Done>
      ) : (
        <p className="text-sm text-[var(--blk-muted)]">Not sent.</p>
      )}

      {!locked && (
        <Footnote>Tap a circle to take someone out. Tap a row to read or edit that message.</Footnote>
      )}
    </Block>
  )
})
