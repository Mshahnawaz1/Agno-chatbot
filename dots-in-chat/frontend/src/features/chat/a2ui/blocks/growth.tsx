/**
 * GrowthCalculator: a monthly investment (SIP) the user can drag. Every number and the curve
 * recompute in the browser as a slider moves.
 *
 * FV = P × [((1+r)^n − 1) / r] × (1+r), r = yearly % / 1200, n = months (an annuity due),
 * plus a one-time lump sum compounding monthly. With inflation, a "today's money" tile shows
 * the future value deflated by (1+i)^years.
 */
import { z } from 'zod'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Block, ChangePill, Footnote, Formula, RangeRow, Stat, StatRow } from './kit'
import { useLive } from './hooks'
import { money, moneyShort } from './format'
import { project, type Plan } from './math'

const GrowthCalculatorApi = {
  name: 'GrowthCalculator',
  schema: z.object({
    monthly: z.number().describe('Monthly amount invested.'),
    rate: z.number().describe('Expected yearly return, in percent (12 = 12%).'),
    years: z.number().describe('How many years the plan runs.'),
    lumpSum: z.number().optional().describe('One-time amount invested at the start.'),
    inflation: z.number().optional().describe('Yearly inflation in percent; adds a value in today\'s money.'),
    title: z.string().optional().describe('Card title. Defaults to "Monthly SIP".'),
    currency: z.string().optional().describe('ISO currency code. Defaults to INR.'),
  }),
}

export const GrowthCalculator = createComponentImplementation(GrowthCalculatorApi, ({ props, context }) => {
  const live = useLive<Plan>(context, {
    monthly: props.monthly,
    rate: props.rate,
    years: props.years,
    lumpSum: props.lumpSum ?? 0,
    inflation: props.inflation ?? 0,
  })
  const plan = live.value
  const set = (k: keyof Plan) => (n: number) => live.set((p) => ({ ...p, [k]: n }))
  const cur = props.currency ?? 'INR'
  const points = project(plan)
  const end = points[points.length - 1]
  const real = plan.inflation ? end.value / Math.pow(1 + plan.inflation / 100, plan.years) : null
  const monthlyMax = Math.max(100000, Math.ceil((props.monthly * 2) / 10000) * 10000)

  return (
    <Block
      title={props.title ?? 'Monthly SIP'}
      subtitle="Drag a slider. Nothing to wait for."
      pill={<ChangePill changed={live.changed} />}
    >
      <div className="flex flex-col gap-3.5">
        <RangeRow label="Monthly amount" display={money(plan.monthly, cur)} value={plan.monthly} min={500} max={monthlyMax} step={500} onChange={set('monthly')} />
        <RangeRow label="Return per year" display={`${plan.rate}%`} value={plan.rate} min={1} max={30} step={0.5} onChange={set('rate')} />
        <RangeRow label="Years" display={plan.years} value={plan.years} min={1} max={40} onChange={set('years')} />
        {props.lumpSum !== undefined && (
          <RangeRow label="Lump sum at start" display={money(plan.lumpSum, cur)} value={plan.lumpSum} min={0} max={Math.max(1000000, props.lumpSum * 2)} step={10000} onChange={set('lumpSum')} />
        )}
        {props.inflation !== undefined && (
          <RangeRow label="Inflation per year" display={`${plan.inflation}%`} value={plan.inflation} min={0} max={12} step={0.5} onChange={set('inflation')} />
        )}
      </div>
      <StatRow>
        <Stat label="Future value" value={moneyShort(end.value, cur)} tone="success" />
        <Stat label="You invest" value={moneyShort(end.invested, cur)} />
        <Stat label="Gain" value={moneyShort(end.value - end.invested, cur)} tone="success" />
        {real !== null && <Stat label="In today's money" value={moneyShort(real, cur)} tone="accent" />}
      </StatRow>
      <GrowthChart points={points} />
      <Formula>FV = P × [((1+r)ⁿ − 1) / r] × (1+r){plan.lumpSum ? ' + L × (1+r)ⁿ' : ''}</Formula>
      <Footnote>
        {plan.rate}% a year is an assumption, not a promise. Past returns do not guarantee future ones.
      </Footnote>
    </Block>
  )
})

/** Value as a filled curve over the invested line, with a dot on the final value. */
function GrowthChart({ points }: { points: { year: number; value: number; invested: number }[] }) {
  const W = 320
  const H = 120
  const pad = 6
  const maxV = Math.max(...points.map((p) => p.value), 1)
  const x = (i: number) => pad + (i / Math.max(points.length - 1, 1)) * (W - pad * 2)
  const y = (v: number) => H - pad - (v / maxV) * (H - pad * 2)
  const line = (k: 'value' | 'invested') => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join('')
  const area = `${line('value')}L${x(points.length - 1)},${H - pad}L${x(0)},${H - pad}Z`
  const last = points[points.length - 1]
  return (
    <figure className="blk-inset flex flex-col gap-1 p-3">
      <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-28 w-full" preserveAspectRatio="none" role="img" aria-label="Value and amount invested over the years">
        <defs>
          <linearGradient id="blk-growth" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--blk-accent)" stopOpacity="0.45" />
            <stop offset="1" stopColor="var(--blk-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#blk-growth)" />
        <path d={line('invested')} fill="none" stroke="var(--blk-muted)" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <path d={line('value')} fill="none" stroke="var(--blk-accent-hi)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* The end dot is HTML: the stretched SVG would draw it as an ellipse. */}
      <span
        aria-hidden
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--blk-accent)] bg-white"
        style={{ left: `${(x(points.length - 1) / W) * 100}%`, top: `${(y(last.value) / H) * 100}%` }}
      />
      </div>
      <figcaption className="flex gap-4 blk-foot">
        <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-3 bg-[var(--blk-accent-hi)]" />Value</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-0 w-3 border-t border-dashed border-[var(--blk-muted)]" />Invested</span>
      </figcaption>
    </figure>
  )
}
