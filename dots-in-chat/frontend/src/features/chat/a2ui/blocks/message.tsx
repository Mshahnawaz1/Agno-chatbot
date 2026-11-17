/**
 * MessageApproval: a message the agent drafted for someone, waiting for the user's OK.
 *
 * Nothing is sent by the agent on its own. "Send message" starts an 8-second undo window (the
 * Done line shows "Undo · 8s"); only when it runs out does the `send_message` event go to the
 * agent. "Edit message" turns the draft into a textarea. "Not now" sends `dismiss_message`.
 */
import { useState } from 'react'
import { z } from 'zod'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Action, Actions, Avatar, Block, Done, Footnote, Pill } from './kit'
import { useCountdown, useLive, useSend } from './hooks'

const UNDO_SECONDS = 8

const MessageApprovalApi = {
  name: 'MessageApproval',
  schema: z.object({
    to: z.string().describe('Name of the person the message goes to, e.g. "Priya Sharma".'),
    message: z.string().describe('The drafted message, exactly as it would be sent.'),
    channel: z.string().optional().describe('Where it is sent, e.g. "WhatsApp", "SMS", "Email". Defaults to "WhatsApp".'),
    detail: z.string().optional().describe('The person\'s role line under their name, e.g. "Product Manager at Zepto".'),
  }),
}

type Stage = 'idle' | 'editing' | 'pending' | 'sent' | 'dismissed'

export const MessageApproval = createComponentImplementation(MessageApprovalApi, ({ props, context }) => {
  const send = useSend(context)
  const live = useLive(context, { text: props.message })
  const text = live.value.text
  const channel = props.channel ?? 'WhatsApp'
  const first = props.to.split(/\s+/)[0]

  const [stage, setStage] = useState<Stage>('idle')
  const [draft, setDraft] = useState(text)
  const [sentAt, setSentAt] = useState('')

  // Runs once the undo window closes: the only place the message actually leaves the block.
  const countdown = useCountdown(() => {
    send('send_message', { to: props.to, channel, text: live.value.text })
    setStage('sent')
  })

  const startSend = () => {
    setSentAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase())
    setStage('pending')
    countdown.start(UNDO_SECONDS)
  }
  const undo = () => {
    countdown.cancel()
    setStage('idle')
  }

  if (stage === 'pending') {
    return (
      <Done
        aside={
          <button type="button" className="blk-chip shrink-0" onClick={undo}>
            Undo · {countdown.left}s
          </button>
        }
      >
        ✓ Sent to {first} · {sentAt}
      </Done>
    )
  }
  if (stage === 'sent') return <Done>✓ Sent to {first} · {sentAt}</Done>
  if (stage === 'dismissed') return <p className="px-1 text-sm text-[var(--blk-muted)]">Not sent.</p>

  const editing = stage === 'editing'
  return (
    <Block
      badges={
        <>
          <Pill tone="accent">Needs your OK</Pill>
          <Pill tone="warn">Reaches 1 person</Pill>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <Avatar name={props.to} />
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-[0.9375rem] font-medium text-[var(--blk-text)]">{props.to}</p>
          {props.detail && <p className="blk-sub truncate">{props.detail}</p>}
        </div>
      </div>

      <div className="blk-inset flex flex-col gap-2 p-3.5">
        <span className="blk-micro">{channel} message</span>
        {editing ? (
          <textarea
            aria-label={`Message to ${props.to}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-[0.875rem] border border-[var(--blk-inset-border)] bg-[var(--blk-card)] px-3 py-2.5 text-sm leading-relaxed text-[var(--blk-text)] outline-none focus-visible:border-[var(--blk-accent-hi)]"
          />
        ) : (
          <p className="text-sm leading-relaxed text-[var(--blk-text)]">“{text}”</p>
        )}
      </div>

      <Actions>
        {editing ? (
          <>
            <Action variant="primary" disabled={!draft.trim()} onClick={() => {
              live.set({ text: draft })
              startSend()
            }}>
              Send edited
            </Action>
            <Action variant="secondary" onClick={() => setStage('idle')}>Cancel edit</Action>
          </>
        ) : (
          <>
            <Action variant="primary" disabled={!text.trim()} onClick={startSend}>Send message</Action>
            <Action variant="secondary" onClick={() => {
              setDraft(text)
              setStage('editing')
            }}>
              Edit message
            </Action>
            <Action variant="ghost" onClick={() => {
              send('dismiss_message', {})
              setStage('dismissed')
            }}>
              Not now
            </Action>
          </>
        )}
      </Actions>

      <Footnote>Sent from your {channel}. You can undo for a few seconds after.</Footnote>
    </Block>
  )
})
