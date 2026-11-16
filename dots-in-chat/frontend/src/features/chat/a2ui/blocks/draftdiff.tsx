/**
 * DraftDiff: an email the agent drafted, shown as a diff against the user's edits.
 *
 * The body is a list of segments: unchanged text, text the user removed (red, struck through)
 * and text they added (green, underlined). Approve sends the final body (unchanged + added, no
 * removed text) as `approve_send`; Keep editing and Discard send their own events. Nothing is
 * sent until the user taps Approve.
 */
import { useState } from 'react'
import { z } from 'zod'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Action, Actions, Block, Done, Pill } from './kit'
import { useSend } from './hooks'

const DraftDiffApi = {
  name: 'DraftDiff',
  schema: z.object({
    subject: z.string().describe('The email subject line.'),
    segments: z
      .array(
        z.object({
          text: z.string().describe('A piece of the body. Keep the spaces and line breaks in it.'),
          change: z
            .enum(['added', 'removed'])
            .optional()
            .describe('"added" for new text, "removed" for text to delete. Omit it for text that stays.'),
        }),
      )
      .describe('The body in order, split into pieces. Removed pieces are shown but not sent.'),
    recipients: z.array(z.string()).optional().describe('Names of the people it goes to. Shows a "To N people" badge.'),
  }),
}

type Outcome = 'approved' | 'kept' | 'discarded' | null

export const DraftDiff = createComponentImplementation(DraftDiffApi, ({ props, context }) => {
  const send = useSend(context)
  const [outcome, setOutcome] = useState<Outcome>(null)
  const recipients = props.recipients ?? []
  const count = recipients.length

  // The body the email would have after the user's edits: unchanged and added text, no removed.
  const body = props.segments
    .filter((s) => s.change !== 'removed')
    .map((s) => s.text)
    .join('')

  const decide = (next: Exclude<Outcome, null>, event: string, eventContext: Record<string, unknown> = {}) => {
    send(event, eventContext)
    setOutcome(next)
  }

  return (
    <Block
      badges={
        <>
          <Pill tone="accent">Draft email</Pill>
          {count > 0 && <Pill tone="warn">{`To ${count} ${count === 1 ? 'person' : 'people'}`}</Pill>}
        </>
      }
    >
      <p className="text-sm text-[var(--blk-text)]">Subject: {props.subject}</p>

      <div className="blk-inset flex flex-col gap-1 p-3.5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--blk-text)]">
          {props.segments.map((s, i) => (
            <span
              key={i}
              className={
                s.change === 'removed'
                  ? 'text-[var(--blk-rose)] line-through'
                  : s.change === 'added'
                    ? 'text-[var(--blk-green)] underline underline-offset-2'
                    : undefined
              }
            >
              {s.text}
            </span>
          ))}
        </p>
      </div>

      {outcome === null ? (
        <>
          <p className="blk-micro -mt-1">Red strikethrough = removed · Green = added</p>
          <Actions>
            <Action
              variant="primary"
              onClick={() => decide('approved', 'approve_send', { subject: props.subject, body, recipients })}
            >
              Approve &amp; send
            </Action>
            <Action variant="secondary" onClick={() => decide('kept', 'keep_editing')}>
              Keep editing
            </Action>
            <Action variant="ghost" onClick={() => decide('discarded', 'discard_draft')}>
              Discard draft
            </Action>
          </Actions>
        </>
      ) : outcome === 'approved' ? (
        <Done>✓ Sent{count > 0 ? ` to ${count} ${count === 1 ? 'person' : 'people'}` : ''}</Done>
      ) : outcome === 'kept' ? (
        <p className="text-sm text-[var(--blk-muted)]">Keep editing: tell me what to change</p>
      ) : (
        <p className="text-sm text-[var(--blk-muted)]">Draft discarded</p>
      )}

    </Block>
  )
})
