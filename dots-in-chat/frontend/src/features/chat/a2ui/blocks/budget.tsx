/**
 * BudgetSplit: an income split into 2–5 parts as a donut ring. A round handle sits on every
 * boundary between neighbouring segments; dragging it (pointer, using the angle from the ring's
 * centre) or pressing the arrow keys on it moves percent between those two neighbours, in whole
 * percents, never below 0. Legend rows and amounts follow. The state is local (useLive), so it
 * is visible to a Suggestions block under it; the block sends no events itself.
 */
import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { z } from 'zod'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Block, ChangePill } from './kit'
import { useLive } from './hooks'
import { money, SERIES } from './format'
import { arc, boundaries, moveBoundary, normalize, polar } from './budget-math'

const BudgetSplitApi = {
  name: 'BudgetSplit',
  schema: z.object({
    income: z.number().describe('Monthly income to split.'),
    parts: z
      .array(
        z.object({
          label: z.string().describe('Name of the part, e.g. Needs.'),
          percent: z.number().describe('Share of income in percent.'),
        }),
      )
      .describe('2 to 5 parts whose percents sum to 100.'),
    title: z.string().optional().describe('Card title. Defaults to "Monthly budget".'),
    currency: z.string().optional().describe('ISO currency code. Defaults to INR.'),
  }),
}

const C = 100 // viewBox centre
const R = 76 // ring centre-line radius
const W = 28 // ring thickness

export const BudgetSplit = createComponentImplementation(BudgetSplitApi, ({ props, context }) => {
  const parts = props.parts.slice(0, 5)
  const labels = parts.map((p) => p.label)
  const was = normalize(parts.map((p) => p.percent))
  const live = useLive<{ percents: number[] }>(context, { percents: was })
  const percents = live.value.percents
  const cur = props.currency ?? 'INR'
  const ring = useRef<HTMLDivElement>(null)
  const bounds = boundaries(percents)
  const set = (next: number[]) => live.set({ percents: next })

  // Pointer position -> percent around the ring, clockwise from the top.
  const posFromPointer = (e: PointerEvent) => {
    const r = ring.current!.getBoundingClientRect()
    const a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2)))
    return ((a < 0 ? a + 2 * Math.PI : a) / (2 * Math.PI)) * 100
  }
  // Keep the drag on the near side of the neighbours, so crossing 0/100 at the top does not jump.
  const onDrag = (i: number) => (e: PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    let pos = posFromPointer(e)
    const cur = bounds[i]
    if (pos - cur > 50) pos -= 100
    else if (cur - pos > 50) pos += 100
    set(moveBoundary(percents, i, pos))
  }
  const onKey = (i: number) => (e: KeyboardEvent) => {
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]
    if (!d) return
    e.preventDefault()
    set(moveBoundary(percents, i, bounds[i] + d))
  }

  let from = 0
  const segments = percents.map((p, i) => {
    const seg = { p, i, from, to: from + p }
    from += p
    return seg
  })

  return (
    <Block
      title={props.title ?? 'Monthly budget'}
      subtitle={`Income ${money(props.income, cur)}${live.changed === 'user' ? ` · was ${was.join(' / ')}` : ''}`}
      pill={<ChangePill changed={live.changed} user="dragged" />}
    >
      <div ref={ring} className="relative mx-auto aspect-square w-full max-w-[15rem] touch-none select-none">
        <svg viewBox="0 0 200 200" className="block size-full" role="img" aria-label={`Budget split: ${labels.map((l, i) => `${l} ${percents[i]}%`).join(', ')}`}>
          <circle cx={C} cy={C} r={R} fill="none" stroke="var(--blk-inset)" strokeWidth={W} />
          {segments.map(({ p, i, from, to }) =>
            p <= 0 ? null : p >= 99.99 ? (
              <circle key={i} cx={C} cy={C} r={R} fill="none" stroke={SERIES[i]} strokeWidth={W} />
            ) : (
              <path key={i} d={arc(C, C, R, from, to)} fill="none" stroke={SERIES[i]} strokeWidth={W} />
            ),
          )}
          {/* Thin separators where segments meet. */}
          {bounds.concat(0).map((b, k) => {
            const [x0, y0] = polar(C, C, R - W / 2, b)
            const [x1, y1] = polar(C, C, R + W / 2, b)
            return <line key={k} x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgb(20 21 32)" strokeWidth="1.5" />
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[1.25rem] font-semibold leading-tight text-[var(--blk-text)] tabular-nums">{money(props.income, cur)}</span>
          <span className="blk-foot">per month</span>
        </div>
        {bounds.map((b, i) => {
          const [x, y] = polar(C, C, R, b)
          return (
            <div
              key={i}
              role="slider"
              tabIndex={0}
              aria-label={`${labels[i]} and ${labels[i + 1]} boundary`}
              aria-orientation="horizontal"
              aria-valuemin={bounds[i] - percents[i]}
              aria-valuemax={bounds[i] + percents[i + 1]}
              aria-valuenow={b}
              aria-valuetext={`${labels[i]} ${percents[i]}%, ${labels[i + 1]} ${percents[i + 1]}%`}
              className="absolute size-5 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-[3px] border-[var(--blk-accent)] bg-white shadow-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--blk-accent-hi)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:cursor-grabbing"
              style={{ left: `${(x / 200) * 100}%`, top: `${(y / 200) * 100}%` }}
              onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
              onPointerMove={onDrag(i)}
              onKeyDown={onKey(i)}
            />
          )
        })}
      </div>
      <ul className="flex flex-col gap-2">
        {percents.map((p, i) => (
          <li key={i} className="blk-inset flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[0.8125rem]">
            <i className="size-2.5 shrink-0 rounded-full" style={{ background: SERIES[i] }} />
            <span className="min-w-0 flex-1 truncate text-[var(--blk-text)]">{labels[i]}</span>
            <span className="w-12 text-center text-[var(--blk-muted)] tabular-nums">{p}%</span>
            <span className="w-24 text-right font-semibold text-[var(--blk-text)] tabular-nums">{money((props.income * p) / 100, cur)}</span>
          </li>
        ))}
      </ul>
      <p className="blk-inset blk-formula px-3 py-2.5 !text-[var(--blk-accent-hi)]">{labels.join(' + ')} = {percents.reduce((s, p) => s + p, 0)}%</p>
    </Block>
  )
})
