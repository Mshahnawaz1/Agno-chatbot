/** Pure maths for the QuadraticExplorer: y = ax² + bx + c. */
import { num } from './format'

export type Quad = { a: number; b: number; c: number }

export function discriminant({ a, b, c }: Quad): number {
  return b * b - 4 * a * c
}

/** Real roots, the "+" one first (as in x = (−b ± √D) / 2a). Empty when D < 0, one when D = 0. */
export function roots(q: Quad): number[] {
  const d = discriminant(q)
  if (d < 0) return []
  if (d === 0) return [-q.b / (2 * q.a)]
  const s = Math.sqrt(d)
  return [(-q.b + s) / (2 * q.a), (-q.b - s) / (2 * q.a)]
}

export function vertex({ a, b, c }: Quad): { x: number; y: number } {
  const x = -b / (2 * a)
  return { x, y: a * x * x + b * x + c }
}

/** A number with a real minus sign: −2, 1.5. */
export function fmt(n: number, digits = 2): string {
  return num(n, digits).replace('-', '−')
}

/** "y = 1x² − 2x − 3": zero terms are left out, signs are spaced. */
export function equation({ a, b, c }: Quad): string {
  let s = `y = ${fmt(a)}x²`
  if (b !== 0) s += ` ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}x`
  if (c !== 0) s += ` ${c < 0 ? '−' : '+'} ${fmt(Math.abs(c))}`
  return s
}

/** The plotted window: always contains the origin, the roots and the vertex of every curve given. */
export function windowFor(qs: Quad[]): { x0: number; x1: number; y0: number; y1: number } {
  let xr = 4
  let ylo = -2
  let yhi = 2
  for (const q of qs) {
    const v = vertex(q)
    xr = Math.max(xr, Math.abs(v.x) + 1.5, ...roots(q).map((r) => Math.abs(r) + 1.5))
    ylo = Math.min(ylo, v.y - 1.5, q.c)
    yhi = Math.max(yhi, v.y + 1.5, q.c)
  }
  xr = Math.min(10, Math.ceil(xr))
  ylo = Math.max(-30, Math.floor(ylo))
  yhi = Math.min(30, Math.ceil(yhi))
  // Keep the plot from being a thin strip.
  if (yhi - ylo < xr) {
    const pad = (xr - (yhi - ylo)) / 2
    ylo -= pad
    yhi += pad
  }
  return { x0: -xr, x1: xr, y0: ylo, y1: yhi }
}

/** A grid step (1, 2, 5, 10...) giving about 6 lines across `span`. */
export function niceStep(span: number): number {
  const raw = span / 6
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / p
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p
}
