/** Pure helpers for the BudgetSplit donut. Percentages are whole numbers summing to 100. */

/** Scales/rounds incoming parts so they are whole percents that sum to exactly 100. */
export function normalize(parts: number[]): number[] {
  const total = parts.reduce((s, p) => s + Math.max(0, p), 0) || 1
  const out = parts.map((p) => Math.floor((Math.max(0, p) / total) * 100))
  let rest = 100 - out.reduce((s, p) => s + p, 0)
  for (let i = 0; rest > 0; i = (i + 1) % out.length, rest--) out[i]++
  return out
}

/** Where boundary i (between segment i and i+1) sits, as percent of the ring from the top. */
export function boundaries(percents: number[]): number[] {
  const out: number[] = []
  let acc = 0
  for (let i = 0; i < percents.length - 1; i++) out.push((acc += percents[i]))
  return out
}

/** Moves boundary i to `pos` (percent), clamped between its neighbours. Others are untouched. */
export function moveBoundary(percents: number[], i: number, pos: number): number[] {
  const start = percents.slice(0, i).reduce((s, p) => s + p, 0)
  const end = start + percents[i] + percents[i + 1]
  const p = Math.min(end, Math.max(start, Math.round(pos)))
  const next = percents.slice()
  next[i] = p - start
  next[i + 1] = end - p
  return next
}

/** Point on a circle, angle measured clockwise from 12 o'clock. */
export function polar(cx: number, cy: number, r: number, pct: number): [number, number] {
  const a = (pct / 100) * 2 * Math.PI
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)]
}

/** A ring segment from pct `from` to `to` (stroke-centre radius r), for a thick stroked path. */
export function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  const [x0, y0] = polar(cx, cy, r, from)
  const [x1, y1] = polar(cx, cy, r, to)
  return `M${x0.toFixed(2)},${y0.toFixed(2)}A${r},${r} 0 ${to - from > 50 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`
}
