/**
 * ChartGallery: a menu of chart types, each a tile with a tiny picture drawn from fixed sample
 * data (not the user's data) and a one-line caption. Tapping a tile sends `pick_chart`
 * {type, name}, marks it selected and disables the others, so the agent can then draw that
 * type from the user's real data. Pictures are hand-written SVG.
 */
import { useState, type ReactNode } from 'react'
import { z } from 'zod'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Block } from './kit'
import { useSend } from './hooks'
import { arcPath, smoothPath, spans } from './charts-math'

const TYPES = ['scatter', 'histogram', 'heatmap', 'radar', 'gauge', 'waterfall', 'bar', 'line', 'area', 'donut'] as const
type Type = (typeof TYPES)[number]

const ChartGalleryApi = {
  name: 'ChartGallery',
  schema: z.object({
    title: z.string().optional().describe('Card title. Defaults to "More chart types".'),
    types: z.array(z.enum(TYPES)).describe('Chart types to offer, only those that suit the data (2 to 6).'),
    subtitle: z.string().optional().describe('Line under the title. Defaults to "Each one is offered only when the data suits it."'),
  }),
}

const INFO: Record<Type, { name: string; caption: string; art: () => ReactNode }> = {
  scatter: { name: 'Scatter', caption: 'Link between two numbers', art: () => <Scatter /> },
  histogram: { name: 'Histogram', caption: 'How values are spread out', art: () => <Histogram /> },
  heatmap: { name: 'Heatmap', caption: 'Day and hour that stand out', art: () => <Heatmap /> },
  radar: { name: 'Radar', caption: 'Balance across 3–8 scores', art: () => <Radar /> },
  gauge: { name: 'Gauge', caption: 'Progress to a goal', art: () => <Gauge /> },
  waterfall: { name: 'Waterfall', caption: 'What moved a total', art: () => <Waterfall /> },
  bar: { name: 'Bar', caption: 'Compare categories side by side', art: () => <Bars /> },
  line: { name: 'Line', caption: 'A trend over time', art: () => <Lines area={false} /> },
  area: { name: 'Area', caption: 'A trend and its volume', art: () => <Lines area /> },
  donut: { name: 'Donut', caption: 'Shares of a whole', art: () => <Donut /> },
}

export const ChartGallery = createComponentImplementation(ChartGalleryApi, ({ props, context }) => {
  const send = useSend(context)
  const [picked, setPicked] = useState<Type | null>(null)
  const types = (props.types ?? []).filter((t): t is Type => t in INFO)
  return (
    <Block title={props.title ?? 'More chart types'} subtitle={props.subtitle ?? 'Each one is offered only when the data suits it.'}>
      <div className="grid grid-cols-2 gap-2.5">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            disabled={picked !== null && picked !== t}
            aria-pressed={picked === t}
            data-on={picked === t || undefined}
            onClick={() => {
              if (picked) return
              setPicked(t)
              send('pick_chart', { type: t, name: INFO[t].name })
            }}
            className="blk-inset flex min-w-0 flex-col gap-1 rounded-2xl p-3 text-left transition-opacity focus-visible:outline-2 focus-visible:outline-[var(--blk-accent-hi)] enabled:hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40 data-[on]:border-[var(--blk-accent)] data-[on]:shadow-[0_0_0_1px_var(--blk-accent)]"
          >
            <svg viewBox="0 0 120 70" className="mb-1.5 h-[4.5rem] w-full" aria-hidden>{INFO[t].art()}</svg>
            <span className="text-[0.8125rem] font-semibold text-[var(--blk-text)]">{INFO[t].name}</span>
            <span className="blk-foot">{INFO[t].caption}</span>
          </button>
        ))}
      </div>
    </Block>
  )
})

const ACC = 'var(--blk-accent)'
const HI = 'var(--blk-accent-hi)'

function Scatter() {
  const xs = [6, 14, 20, 26, 34, 40, 46, 54, 62, 70, 78, 86, 94, 102, 110]
  const ys = [56, 46, 52, 40, 38, 44, 34, 28, 36, 24, 26, 18, 14, 16, 8]
  return (
    <>
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i] + (i % 3) * 2} r="2.2" fill={HI} />)}
      <line x1="6" y1="58" x2="114" y2="10" stroke="var(--blk-amber)" strokeWidth="1.4" strokeDasharray="4 3" />
    </>
  )
}

function Histogram() {
  const hs = [6, 14, 28, 42, 56, 66, 48, 36, 18, 10, 6]
  return <>{hs.map((h, i) => <rect key={i} x={4 + i * 10.4} y={68 - h} width="8.6" height={h} rx="1.5" fill={ACC} opacity={0.5 + h / 140} />)}</>
}

function Heatmap() {
  const cells: ReactNode[] = []
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 11; c++) {
      const v = Math.max(0.12, 1 - Math.abs(c - 6) / 6 - Math.abs(r - 3) / 6 + ((r * 3 + c * 5) % 4) / 14)
      cells.push(<rect key={`${r}${c}`} x={3 + c * 10.5} y={3 + r * 13} width="8.6" height="10.5" rx="2" fill={ACC} opacity={Math.min(v, 1)} />)
    }
  return <>{cells}</>
}

function Radar() {
  const pt = (i: number, r: number): [number, number] => {
    const a = (i / 5) * 2 * Math.PI - Math.PI / 2
    return [60 + r * Math.cos(a), 35 + r * Math.sin(a)]
  }
  const poly = (rs: number[]) => rs.map((r, i) => pt(i, r).join(',')).join(' ')
  return (
    <>
      {[30, 15].map((r) => <polygon key={r} points={poly([r, r, r, r, r])} fill="none" stroke="rgb(255 255 255 / 0.18)" />)}
      <polygon points={poly([26, 20, 28, 14, 22])} fill={ACC} fillOpacity="0.4" stroke={HI} strokeWidth="1.5" />
    </>
  )
}

function Gauge() {
  return (
    <>
      <path d={arcPath(60, 54, 36, -0.25, 0.25, false)} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="9" strokeLinecap="round" />
      <path d={arcPath(60, 54, 36, -0.25, -0.25 + 0.5 * 0.72, false)} fill="none" stroke="var(--blk-teal)" strokeWidth="9" strokeLinecap="round" />
      <text x="60" y="52" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--blk-text)">72%</text>
      <text x="60" y="63" textAnchor="middle" fontSize="7" fill="var(--blk-muted)">of goal</text>
    </>
  )
}

function Waterfall() {
  return (
    <>
      <rect x="6" y="22" width="16" height="44" rx="2" fill={ACC} />
      <rect x="30" y="8" width="16" height="14" rx="2" fill="var(--blk-teal)" />
      <rect x="54" y="14" width="16" height="16" rx="2" fill="var(--blk-rose)" />
      <rect x="78" y="22" width="16" height="9" rx="2" fill="var(--blk-rose)" />
      <rect x="102" y="18" width="14" height="48" rx="2" fill={ACC} />
    </>
  )
}

function Bars() {
  const hs = [26, 44, 20, 58, 36, 50]
  return <>{hs.map((h, i) => <rect key={i} x={8 + i * 18} y={66 - h} width="12" height={h} rx="2.5" fill={ACC} opacity={i === 3 ? 1 : 0.7} />)}</>
}

function Lines({ area }: { area: boolean }) {
  const pts: [number, number][] = [[6, 50], [26, 36], [46, 44], [66, 22], [86, 30], [114, 10]]
  return (
    <>
      {area && <path d={`${smoothPath(pts)}L114,66L6,66Z`} fill={ACC} opacity="0.3" />}
      <path d={smoothPath(pts)} fill="none" stroke={HI} strokeWidth="2" />
    </>
  )
}

function Donut() {
  const parts = [0.4, 0.25, 0.2, 0.15]
  const cols = ['var(--blk-accent)', 'var(--blk-teal)', 'var(--blk-amber)', 'var(--blk-rose)']
  const arcs = spans(parts)
  return (
    <>
      {parts.map((_, i) => {
        const d = arcPath(60, 35, 24, arcs[i][0], arcs[i][1], false)
        return <path key={i} d={d} fill="none" stroke={cols[i]} strokeWidth="11" />
      })}
    </>
  )
}
