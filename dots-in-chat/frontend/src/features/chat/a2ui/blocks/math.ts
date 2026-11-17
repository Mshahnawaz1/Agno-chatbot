/** Pure maths behind the blocks, kept apart from their views so it can be tested. */

export type Plan = { monthly: number; rate: number; years: number; lumpSum: number; inflation: number }

/** Value and amount invested after each year, from year 0. */
export function project(p: Plan) {
  const r = p.rate / 1200
  const points: { year: number; value: number; invested: number }[] = []
  for (let y = 0; y <= p.years; y++) {
    const n = y * 12
    const sip = r === 0 ? p.monthly * n : p.monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
    points.push({ year: y, value: sip + p.lumpSum * Math.pow(1 + r, n), invested: p.monthly * n + p.lumpSum })
  }
  return points
}
