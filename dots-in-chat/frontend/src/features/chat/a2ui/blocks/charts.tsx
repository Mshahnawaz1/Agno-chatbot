/**
 * ChartSwitcher: one small data set the user can view as bar, line, area, pie or donut.
 *
 * The block, not the model, decides which styles are honest: pie/donut are greyed unless the
 * values are parts of a whole (and at most 6), line/area unless the points are ordered. A
 * footnote says why in one sentence per greyed style. Charts are hand-written SVG. The current
 * style is live state (useLive), so the agent can see which one the user picked. No events.
 */
import { useId, useState } from 'react'
import { z } from 'zod'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Block, Footnote, Segmented } from './kit'
import { useLive } from './hooks'
import { money, moneyShort, SERIES } from './format'
import { arcPath, niceTicks, smoothPath, spans, STYLE_NAMES, tickLabel, trim, whyNot, type ChartStyle } from './charts-math'

const ALL: ChartStyle[] = ['bar', 'line', 'area', 'pie', 'donut']
const StyleEnum = z.enum(['bar', 'line', 'area', 'pie', 'donut'])

const ChartSwitcherApi = {
  name: 'ChartSwitcher',
  schema: z.object({
    title: z.string().describe('Card title, e.g. "Spending this week".'),
    data: z.array(z.object({ label: z.string().describe('Category or x label.'), value: z.number().describe('The number.') })).describe('The points, in order.'),
    styles: z.array(StyleEnum).optional().describe('Styles offered in the toggle. Defaults to bar, line, area, pie.'),
    style: StyleEnum.optional().describe('The style shown first. Defaults to the first enabled one in styles.'),
    partsOfWhole: z.boolean().optional().describe('True when the values add up to a meaningful total (enables pie/donut). Defaults to false.'),
    ordered: z.boolean().optional().describe('True when the points have a natural order such as time (enables line/area). Defaults to true.'),
    currency: z.string().optional().describe('ISO currency code. Defaults to INR.'),
    unit: z.string().optional().describe('A unit shown instead of money, e.g. "steps" or "hours".'),
    note: z.string().optional().describe('Footnote text that replaces the automatic explanation of greyed styles.'),
  }),
}

export const ChartSwitcher = createComponentImplementation(ChartSwitcherApi, ({ props, context }) => {
  const data = props.data ?? []
  const offered = (props.styles?.length ? props.styles : (['bar', 'line', 'area', 'pie'] as ChartStyle[])).filter((s) => ALL.includes(s))
  const facts = { partsOfWhole: props.partsOfWhole ?? false, ordered: props.ordered ?? true, count: data.length }
  const reasons = offered.map((s) => [s, whyNot(s, facts)] as const)
  const enabled = reasons.filter(([, r]) => !r).map(([s]) => s)
  const wanted = props.style ?? offered[0]
  const live = useLive<{ style: ChartStyle }>(context, { style: enabled.includes(wanted) ? wanted : (enabled[0] ?? 'bar') })
  const style = enabled.includes(live.value.style) ? live.value.style : (enabled[0] ?? 'bar')
  const cur = props.currency ?? 'INR'
  const fmt = (n: number) => (props.unit ? `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(n)} ${props.unit}` : money(n, cur))
  const cartesian = style === 'bar' || style === 'line' || style === 'area'
  const others = enabled.filter((s) => s === 'bar' || s === 'line' || s === 'area')

  const greyed = reasons.filter(([, r]) => r)
  const explanation = props.note ?? (greyed.length
    ? `${greyed.map(([s, r]) => `${STYLE_NAMES[s]} is greyed${s === 'pie' || s === 'donut' ? ' out' : ''}: ${r}.`).join(' ')} The toggle only offers styles the data can honestly show.`
    : null)

  return (
    <Block title={props.title}>
      <Segmented
        label="Chart style"
        value={style}
        onChange={(v) => live.set({ style: v as ChartStyle })}
        options={offered.map((s, i) => ({
          value: s,
          label: STYLE_NAMES[s],
          disabled: !!reasons[i][1],
          title: reasons[i][1] ? `${STYLE_NAMES[s]} is not offered: ${reasons[i][1]}.` : undefined,
        }))}
      />
      {data.length === 0 ? (
        <p className="blk-sub">No data to chart.</p>
      ) : cartesian ? (
        <Cartesian key={style} data={data} kind={style} fmt={fmt} />
      ) : (
        <Ring data={data} donut={style === 'donut'} fmt={fmt} total={props.unit ? `${trim(data.reduce((a, d) => a + d.value, 0))}` : compactMoney(data.reduce((a, d) => a + d.value, 0), cur)} sub={props.unit ?? 'this month'} />
      )}
      {explanation && <Footnote>{explanation}</Footnote>}
      {cartesian && others.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="blk-micro">Same data, other styles</span>
          <div className="grid grid-cols-3 gap-2">
            {others.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Show as ${STYLE_NAMES[s]}`}
                aria-pressed={s === style}
                onClick={() => live.set({ style: s })}
                className="blk-inset flex h-14 items-center justify-center rounded-xl border-[var(--blk-inset-border)] p-1.5 focus-visible:outline-2 focus-visible:outline-[var(--blk-accent-hi)] aria-pressed:border-[var(--blk-accent)] aria-pressed:shadow-[0_0_0_1px_var(--blk-accent)]"
              >
                <Thumb kind={s} data={data} />
              </button>
            ))}
          </div>
        </div>
      )}
    </Block>
  )
})

/** ₹20k for the ring centre: money, but k for tens of thousands like the design. */
function compactMoney(n: number, cur: string): string {
  if (cur === 'INR' && Math.abs(n) >= 1e4 && Math.abs(n) < 1e5) return `₹${trim(n / 1000)}k`
  return moneyShort(n, cur)
}

const W = 320
const H = 190
const M = { l: 32, r: 8, t: 30, b: 24 }

/** Bar / line / area on shared axes; the max point wears a pill, and hover or focus moves it. */
function Cartesian({ data, kind, fmt }: { data: { label: string; value: number }[]; kind: 'bar' | 'line' | 'area'; fmt: (n: number) => string }) {
  const uid = useId().replace(/:/g, '')
  const maxI = data.reduce((m, d, i) => (d.value > data[m].value ? i : m), 0)
  const [hot, setHot] = useState<number | null>(null)
  const shown = hot ?? maxI
  const ticks = niceTicks(Math.min(...data.map((d) => d.value)), Math.max(...data.map((d) => d.value)))
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const iw = W - M.l - M.r
  const ih = H - M.t - M.b
  const y = (v: number) => M.t + ih - ((v - lo) / (hi - lo || 1)) * ih
  const slot = iw / data.length
  const cx = (i: number) => M.l + slot * (i + 0.5)
  const pts: [number, number][] = data.map((d, i) => [cx(i), y(d.value)])
  const baseY = y(Math.max(lo, 0))
  const barW = Math.min(slot * 0.55, 30)

  const text = `${data[shown].label} ${fmt(data[shown].value)}`
  const pw = text.length * 6.4 + 18
  const px = Math.min(Math.max(pts[shown][0] - pw / 2, 2), W - pw - 2)
  const py = Math.max(pts[shown][1] - (kind === 'bar' ? 26 : 30), 2)
  const on = { onMouseLeave: () => setHot(null) }

  return (
    <figure className="blk-inset p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label={`${kind} chart`} {...on}>
        <defs>
          <linearGradient id={`${uid}b`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--blk-accent)" />
            <stop offset="1" stopColor="var(--blk-accent)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={`${uid}h`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#e4e7ff" />
            <stop offset="1" stopColor="var(--blk-accent-hi)" />
          </linearGradient>
          <linearGradient id={`${uid}a`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--blk-accent)" stopOpacity="0.5" />
            <stop offset="1" stopColor="var(--blk-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.07)" />
            <text x={M.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize="9.5" fill="var(--blk-muted)">{tickLabel(t)}</text>
          </g>
        ))}
        {kind === 'bar' &&
          data.map((d, i) => (
            <rect
              key={i}
              x={cx(i) - barW / 2}
              y={Math.min(y(d.value), baseY)}
              width={barW}
              height={Math.max(Math.abs(baseY - y(d.value)), 1)}
              rx="4"
              fill={`url(#${uid}${i === shown ? 'h' : 'b'})`}
              tabIndex={0}
              role="img"
              aria-label={`${d.label} ${fmt(d.value)}`}
              onMouseEnter={() => setHot(i)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(null)}
              className="outline-none focus-visible:stroke-white"
            />
          ))}
        {kind !== 'bar' && (
          <>
            {kind === 'area' && <path d={`${smoothPath(pts)}L${pts[pts.length - 1][0]},${baseY}L${pts[0][0]},${baseY}Z`} fill={`url(#${uid}a)`} />}
            <path d={smoothPath(pts)} fill="none" stroke="var(--blk-accent-hi)" strokeWidth="2" strokeLinecap="round" />
            {pts.map(([x, yy], i) => (
              <g key={i}>
                <circle cx={x} cy={yy} r={i === shown ? 4.5 : 3} fill={i === shown ? '#fff' : 'var(--blk-accent-hi)'} stroke="var(--blk-accent)" strokeWidth="2" />
                {/* a wider invisible target for hover and keyboard focus */}
                <circle cx={x} cy={yy} r="12" fill="transparent" tabIndex={0} role="img" aria-label={`${data[i].label} ${fmt(data[i].value)}`}
                  className="outline-none" onMouseEnter={() => setHot(i)} onFocus={() => setHot(i)} onBlur={() => setHot(null)} />
              </g>
            ))}
          </>
        )}
        {data.map((d, i) => (
          <text key={i} x={pts[i][0]} y={H - 7} textAnchor="middle" fontSize="10" fill="var(--blk-muted)">{d.label.length > 7 && data.length > 5 ? d.label.slice(0, 6) + '…' : d.label}</text>
        ))}
        <g aria-hidden pointerEvents="none">
          <rect x={px} y={py} width={pw} height="20" rx="10" fill="var(--blk-accent)" />
          <text x={px + pw / 2} y={py + 13.5} textAnchor="middle" fontSize="10.5" fontWeight="500" fill="#fff">{text}</text>
        </g>
      </svg>
    </figure>
  )
}

/** Pie or donut with the total in the middle (donut) and a legend of dot, label, amount. */
function Ring({ data, donut, fmt, total, sub }: { data: { label: string; value: number }[]; donut: boolean; fmt: (n: number) => string; total: string; sub: string }) {
  const arcs = spans(data.map((d) => d.value))
  const R = 50
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="size-[8.5rem] shrink-0" role="img" aria-label={`${donut ? 'Donut' : 'Pie'} chart, total ${total}`}>
        {data.map((_, i) => {
          const [from, to] = arcs[i]
          const color = SERIES[i % SERIES.length]
          return donut ? (
            <path key={i} d={arcPath(60, 60, 44, from, to, false)} fill="none" stroke={color} strokeWidth="20" />
          ) : (
            <path key={i} d={arcPath(60, 60, R, from, to, true)} fill={color} stroke="rgb(0 0 0 / 0.35)" strokeWidth="1.5" />
          )
        })}
        {donut && (
          <>
            <text x="60" y="61" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--blk-text)">{total}</text>
            <text x="60" y="75" textAnchor="middle" fontSize="8" fill="var(--blk-muted)">{sub}</text>
          </>
        )}
      </svg>
      <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-[0.8125rem] text-[var(--blk-text)]">
            <i className="size-2 shrink-0 rounded-full" style={{ background: SERIES[i % SERIES.length] }} />
            <span className="min-w-0 flex-1 truncate">{d.label}</span>
            <span className="tabular-nums">{fmt(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A tiny picture of the same data in another style, for the "other styles" row. */
function Thumb({ kind, data }: { kind: 'bar' | 'line' | 'area'; data: { value: number }[] }) {
  const w = 90
  const h = 40
  const max = Math.max(...data.map((d) => d.value), 1)
  const n = data.length
  const pts: [number, number][] = data.map((d, i) => [4 + (i / Math.max(n - 1, 1)) * (w - 8), h - 4 - (d.value / max) * (h - 10)])
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" aria-hidden>
      {kind === 'bar'
        ? data.map((d, i) => {
            const bw = (w - 8) / n
            const bh = (d.value / max) * (h - 8)
            return <rect key={i} x={4 + i * bw + bw * 0.15} y={h - 4 - bh} width={bw * 0.7} height={bh} rx="1.5" fill="var(--blk-accent)" opacity="0.9" />
          })
        : (
          <>
            {kind === 'area' && <path d={`${smoothPath(pts)}L${pts[n - 1][0]},${h - 4}L${pts[0][0]},${h - 4}Z`} fill="var(--blk-accent)" opacity="0.3" />}
            <path d={smoothPath(pts)} fill="none" stroke="var(--blk-accent-hi)" strokeWidth="1.6" />
          </>
        )}
    </svg>
  )
}
