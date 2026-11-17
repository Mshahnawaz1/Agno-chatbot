/**
 * QuadraticExplorer: y = ax² + bx + c with three sliders. The curve, its roots and vertex, the
 * equation, and the quadratic formula with the numbers substituted all recompute in the browser.
 * The curve the agent sent stays on the plot dashed once the user changes it. `a` cannot be 0
 * (the slider skips it). The maths lives in quadratic-math.ts. No events.
 */
import { z } from 'zod'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Block, ChangePill, Formula, RangeRow, Stat, StatRow } from './kit'
import { useLive } from './hooks'
import { discriminant, equation, fmt, niceStep, roots, vertex, windowFor, type Quad } from './quadratic-math'

const QuadraticExplorerApi = {
  name: 'QuadraticExplorer',
  schema: z.object({
    a: z.number().describe('Coefficient of x². Not 0.'),
    b: z.number().describe('Coefficient of x.'),
    c: z.number().describe('Constant term.'),
  }),
}

export const QuadraticExplorer = createComponentImplementation(QuadraticExplorerApi, ({ props, context }) => {
  const orig: Quad = { a: props.a || 1, b: props.b, c: props.c }
  const live = useLive<Quad>(context, orig)
  const q = live.value
  const set = (k: keyof Quad) => (n: number) =>
    live.set((p) => ({ ...p, [k]: k === 'a' && n === 0 ? (p.a > 0 ? -0.5 : 0.5) : n }))
  const d = discriminant(q)
  const rs = roots(q)
  const v = vertex(q)
  const changed = live.changed === 'user' && (q.a !== orig.a || q.b !== orig.b || q.c !== orig.c)

  return (
    <Block title="Quadratic explorer" subtitle="y = ax² + bx + c" pill={<ChangePill changed={live.changed} user="edited" />}>
      <Plot q={q} orig={changed ? orig : null} />
      <div className="flex flex-col gap-3.5">
        <RangeRow label="a" display={fmt(q.a)} value={q.a} min={-10} max={10} step={0.5} onChange={set('a')} />
        <RangeRow label="b" display={fmt(q.b)} value={q.b} min={-10} max={10} step={0.5} onChange={set('b')} />
        <RangeRow label="c" display={fmt(q.c)} value={q.c} min={-10} max={10} step={0.5} onChange={set('c')} />
      </div>
      <p className="blk-inset px-3 py-3.5 text-center text-[1.25rem] font-medium tabular-nums text-[var(--blk-text)]" data-testid="equation">
        {equation(q)}
      </p>
      <StatRow>
        <Stat label="Roots" value={d < 0 ? 'none (real)' : `x = ${rs.map((r) => fmt(r)).join(', ')}`} />
        <Stat label="Vertex" value={`(${fmt(v.x)}, ${fmt(v.y)})`} />
        <Stat label="Discriminant" value={fmt(d)} />
      </StatRow>
      <Formula>
        x = (−b ± √(b² − 4ac)) / 2a = ({fmt(-q.b)} ± √{fmt(d)}) / {fmt(2 * q.a)}
      </Formula>
    </Block>
  )
})

const W = 320
const H = 210

/** The plot: grid, axes, the current curve (and the original, dashed), roots and vertex. */
function Plot({ q, orig }: { q: Quad; orig: Quad | null }) {
  const win = windowFor(orig ? [q, orig] : [q])
  const sx = (x: number) => ((x - win.x0) / (win.x1 - win.x0)) * W
  const sy = (y: number) => H - ((y - win.y0) / (win.y1 - win.y0)) * H
  const curve = (c: Quad) => {
    let s = ''
    for (let i = 0; i <= 160; i++) {
      const x = win.x0 + ((win.x1 - win.x0) * i) / 160
      const y = Math.max(win.y0 - 50, Math.min(win.y1 + 50, c.a * x * x + c.b * x + c.c))
      s += `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`
    }
    return s
  }
  const v = vertex(q)
  const gx = niceStep(win.x1 - win.x0)
  const gy = niceStep(win.y1 - win.y0)
  const xs: number[] = []
  for (let x = Math.ceil(win.x0 / gx) * gx; x <= win.x1; x += gx) xs.push(x)
  const ys: number[] = []
  for (let y = Math.ceil(win.y0 / gy) * gy; y <= win.y1; y += gy) ys.push(y)
  const inside = (x: number, y: number) => x >= win.x0 && x <= win.x1 && y >= win.y0 && y <= win.y1
  const clampX = (x: number) => Math.max(34, Math.min(W - 34, x))
  const label = { fontSize: 9, fontFamily: 'var(--blk-font)' } as const
  return (
    <figure className="blk-inset p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label={`Graph of ${equation(q)}`}>
        <defs>
          <clipPath id="blk-quad-clip"><rect width={W} height={H} /></clipPath>
        </defs>
        {xs.map((x) => <line key={`x${x}`} x1={sx(x)} x2={sx(x)} y1={0} y2={H} stroke="var(--blk-inset-border)" strokeWidth="1" />)}
        {ys.map((y) => <line key={`y${y}`} x1={0} x2={W} y1={sy(y)} y2={sy(y)} stroke="var(--blk-inset-border)" strokeWidth="1" />)}
        <line x1={sx(0)} x2={sx(0)} y1={0} y2={H} stroke="var(--blk-subtle)" strokeWidth="1" />
        <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} stroke="var(--blk-subtle)" strokeWidth="1" />
        <g clipPath="url(#blk-quad-clip)" fill="none">
          {orig && <path d={curve(orig)} stroke="var(--blk-muted)" strokeWidth="1.5" strokeDasharray="4 4" />}
          <path d={curve(q)} stroke="var(--blk-accent-hi)" strokeWidth="2.5" />
        </g>
        {roots(q).map((r) => (
          <g key={r}>
            <circle cx={sx(r)} cy={sy(0)} r="4" fill="var(--blk-amber)" />
            <text x={clampX(sx(r) + (r < v.x ? -20 : r > v.x ? 20 : 0))} y={sy(0) + 16} textAnchor="middle" fill="var(--blk-amber)" {...{ style: label }}>{`x = ${fmt(r)}`}</text>
          </g>
        ))}
        {inside(v.x, v.y) && (
          <g>
            <circle cx={sx(v.x)} cy={sy(v.y)} r="4" fill="var(--blk-green)" />
            <text x={clampX(sx(v.x))} y={sy(v.y) + (q.a > 0 ? 16 : -9)} textAnchor="middle" fill="var(--blk-green)" {...{ style: label }}>{`vertex (${fmt(v.x)}, ${fmt(v.y)})`}</text>
          </g>
        )}
      </svg>
    </figure>
  )
}
