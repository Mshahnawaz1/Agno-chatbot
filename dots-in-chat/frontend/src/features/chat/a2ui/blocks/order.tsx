/**
 * OrderReview: a basket to check before paying. Money moves only after a deliberate hold:
 * the primary button must be pressed and HELD for 1.5 s (pointer, or Space/Enter held). A
 * lighter overlay fills left to right while holding; letting go early cancels and resets.
 * With prefers-reduced-motion the fill is skipped but the hold is still required. Completing
 * sends `place_order`; "Edit items" sends `edit_order`; "Cancel" sends `cancel_order`. After
 * any decision the buttons give way to a line saying what was decided.
 */
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Action, Actions, Block, Done, Footnote, Pill } from './kit'
import { useSend } from './hooks'
import { money } from './format'

const HOLD_MS = 1500

const OrderReviewApi = {
  name: 'OrderReview',
  schema: z.object({
    items: z
      .array(
        z.object({
          name: z.string().describe('Item name with size, e.g. "Amul Milk 500 ml".'),
          qty: z.number().describe('Quantity.'),
          price: z.number().describe('Line total for this item (not per unit).'),
        }),
      )
      .describe('The basket lines.'),
    fees: z
      .array(z.object({ label: z.string().describe('e.g. "Delivery + taxes".'), amount: z.number().describe('Fee amount.') }))
      .optional()
      .describe('Extra charges shown muted under the items.'),
    payment: z.string().describe('How it is paid, e.g. "UPI ending 4821".'),
    title: z.string().optional().describe('Optional card title.'),
    currency: z.string().optional().describe('ISO currency code. Defaults to INR.'),
  }),
}

type Decision = 'placed' | 'edit' | 'cancel'

export const OrderReview = createComponentImplementation(OrderReviewApi, ({ props, context }) => {
  const items = props.items ?? []
  const fees = props.fees ?? []
  const cur = props.currency ?? 'INR'
  const total = items.reduce((s, i) => s + i.price, 0) + fees.reduce((s, f) => s + f.amount, 0)
  const send = useSend(context)
  const [decision, setDecision] = useState<Decision | null>(null)

  return (
    <Block
      title={props.title}
      badges={
        <>
          <Pill tone="accent">Needs your OK</Pill>
          <Pill tone="warn">Paid</Pill>
        </>
      }
    >
      <div className="blk-inset flex flex-col px-3.5">
        {items.map((i, n) => (
          <div key={n} className="flex items-baseline justify-between gap-3 border-b border-[var(--blk-inset-border)] py-3 text-[0.8125rem] text-[var(--blk-text)]">
            <span className="min-w-0">
              {i.name} <span className="text-[var(--blk-muted)]">×{i.qty}</span>
            </span>
            <span className="tabular-nums">{money(i.price, cur)}</span>
          </div>
        ))}
        {fees.map((f, n) => (
          <div key={n} className="flex items-baseline justify-between gap-3 border-b border-[var(--blk-inset-border)] py-3 text-[0.8125rem] text-[var(--blk-subtle)]">
            <span>{f.label}</span>
            <span className="tabular-nums">{money(f.amount, cur)}</span>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 py-3.5">
          <span className="text-[0.9375rem] font-medium text-[var(--blk-text)]">Total</span>
          <span className="text-[1.375rem] font-semibold tabular-nums text-[var(--blk-text)]">{money(total, cur)}</span>
        </div>
      </div>

      <p className="blk-tone-warn rounded-xl border px-3.5 py-2.5 text-xs">
        Paid · hard to undo · charged to {props.payment}
      </p>

      {decision === null ? (
        <Actions>
          <HoldButton
            onComplete={() => {
              setDecision('placed')
              send('place_order', { items, fees, total, payment: props.payment })
            }}
          />
          <Action
            onClick={() => {
              setDecision('edit')
              send('edit_order', { items })
            }}
          >
            Edit items
          </Action>
          <Action
            variant="ghost"
            onClick={() => {
              setDecision('cancel')
              send('cancel_order', {})
            }}
          >
            Cancel
          </Action>
        </Actions>
      ) : (
        <Done>
          {decision === 'placed' && `✓ Order placed · ${money(total, cur)}`}
          {decision === 'edit' && 'Editing the items'}
          {decision === 'cancel' && 'Order cancelled · nothing was charged'}
        </Done>
      )}
      <Footnote>Money actions always need a deliberate hold, never a single tap.</Footnote>
    </Block>
  )
})

/** A button that completes only after being held for HOLD_MS. */
function HoldButton({ onComplete }: { onComplete: () => void }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const done = useRef(onComplete)
  useEffect(() => {
    done.current = onComplete
  })
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }
  const start = () => {
    if (timer.current) return
    setHolding(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setHolding(false)
      done.current()
    }, HOLD_MS)
  }
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  return (
    <>
      <button
        type="button"
        aria-describedby="hold-help"
        data-holding={holding || undefined}
        className="blk-btn blk-btn-secondary relative touch-none select-none overflow-hidden !border-[var(--blk-accent)]"
        onPointerDown={(e) => {
          if (e.button !== 0) return
          start()
        }}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault()
            start()
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') cancel()
        }}
        onBlur={cancel}
        onClick={(e) => e.preventDefault()}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-[var(--blk-accent)]/60"
          style={{
            width: holding && !reduced ? '100%' : '0%',
            transition: holding && !reduced ? `width ${HOLD_MS}ms linear` : 'width 150ms ease-out',
          }}
        />
        <span className="relative font-medium">Hold to place order</span>
      </button>
      <span id="hold-help" className="sr-only">
        Press and hold for one and a half seconds to place the order. Releasing early cancels. A single tap does nothing.
      </span>
    </>
  )
}
