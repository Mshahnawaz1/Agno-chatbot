/** Pure helpers for the ChartSwitcher block: which styles are honest, nice axis ticks, curves, arcs. */

export type ChartStyle = 'bar' | 'line' | 'area' | 'pie' | 'donut'
export const STYLE_NAMES: Record<ChartStyle, string> = { bar: 'Bar', line: 'Line', area: 'Area', pie: 'Pie', donut: 'Donut' }

export type Datum = { label: string; value: number }

/** Why a style cannot honestly show this data, or null when it can. A short clause, no full stop. */
export function whyNot(
  style: ChartStyle,
  facts: { partsOfWhole: boolean; ordered: boolean; count: number },
): string | null {
  if (style === 'pie' || style === 'donut') {
    if (!facts.partsOfWhole) return 'the values are not parts of a whole'
    if (facts.count > 6) return 'more than six slices are hard to read'
    if (facts.count < 2) return 'one value has nothing to split'
  }
  if ((style === 'line' || style === 'area') && !facts.ordered) return 'categories have no order'
  return null
}

/** Round up to a "nice" number (1, 2, 2.5, 5 times a power of ten) and give ticks from `min` to it. */
export function niceTicks(min: number, max: number, target = 4): number[] {
  const lo = Math.min(0, min)
  const span = Math.max(max - lo, 1e-9)
  const raw = span / target
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = ([1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow)
  const ticks: number[] = []
  for (let v = Math.floor(lo / step) * step; v < max + step * 0.999; v += step) {
    ticks.push(Number(v.toFixed(10)))
    if (v >= max) break
  }
  return ticks
}

/** Axis label: 0, 500 -> 0.5k, 1500 -> 1.5k, 2000 -> 2k. */
export function tickLabel(v: number): string {
  const a = Math.abs(v)
  if (a >= 1e6) return `${trim(v / 1e6)}M`
  if (a >= 1000) return `${trim(v / 1000)}k`
  return trim(v)
}

export function trim(n: number): string {
  return Number(n.toFixed(1)).toString()
}

/** A line through the points. */
export function smoothPath(pts: [number, number][]): string {
  // Straight segments, as the design draws them: a curve would invent values between days.
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('')
}

/** SVG arc path along a circle; a wedge to the centre when `wedge` is set. Angles in turns (0 = top). */
export function arcPath(cx: number, cy: number, r: number, from: number, to: number, wedge: boolean): string {
  const sweep = Math.min(to - from, 0.99999)
  const p = (t: number) => {
    const a = t * 2 * Math.PI - Math.PI / 2
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
  }
  const arc = `M${p(from)}A${r},${r} 0 ${sweep > 0.5 ? 1 : 0} 1 ${p(from + sweep)}`
  return wedge ? `M${cx},${cy}L${p(from)}A${r},${r} 0 ${sweep > 0.5 ? 1 : 0} 1 ${p(from + sweep)}Z` : arc
}

/** Start and end of each share around a ring, in turns (0..1). Negative values count as zero. */
export function spans(values: number[]): [number, number][] {
  const sum = values.reduce((a, v) => a + Math.max(v, 0), 0) || 1
  return values.map((_, i) => {
    const from = values.slice(0, i).reduce((a, v) => a + Math.max(v, 0), 0)
    return [from / sum, (from + Math.max(values[i], 0)) / sum]
  })
}
