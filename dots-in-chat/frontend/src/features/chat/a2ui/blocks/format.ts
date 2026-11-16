/** Number formatting for blocks. Money is INR by default, written the Indian way (L, Cr). */

const grouped = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

/** Full amount: ₹19,200. Other currencies use their own symbol. */
export function money(n: number, currency = 'INR'): string {
  if (currency === 'INR') return `₹${grouped.format(Math.round(n))}`
  return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

/** Short amount for tiles: ₹50.5L, ₹1.2Cr, ₹18,000; other currencies $1.2M. */
export function moneyShort(n: number, currency = 'INR'): string {
  if (currency !== 'INR') {
    return new Intl.NumberFormat('en', {
      style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1,
    }).format(n)
  }
  const sign = n < 0 ? '-' : ''
  const a = Math.abs(n)
  if (a >= 1e7) return `${sign}₹${trim(a / 1e7)}Cr`
  if (a >= 1e5) return `${sign}₹${trim(a / 1e5)}L`
  return `${sign}₹${grouped.format(Math.round(a))}`
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '')
}

/** A number without trailing zeros: 2, -0.5, 1.25. */
export function num(n: number, digits = 2): string {
  const r = Number(n.toFixed(digits))
  return Object.is(r, -0) ? '0' : String(r)
}

/** Series colours, in the order the design uses them. */
export const SERIES = ['var(--blk-accent)', 'var(--blk-teal)', 'var(--blk-amber)', 'var(--blk-rose)', 'var(--blk-violet)', 'var(--blk-sky)']
