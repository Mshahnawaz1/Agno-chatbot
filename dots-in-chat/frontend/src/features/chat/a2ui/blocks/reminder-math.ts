/** Pure date helpers for ReminderPicker. All datetimes are local, "YYYY-MM-DDTHH:mm". */

const pad = (n: number) => String(n).padStart(2, '0')

/** Local datetime string for a Date. */
export function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Parses a local ISO datetime; null when it is not one. */
export function parseLocal(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(s)
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  return Number.isNaN(d.getTime()) ? null : d
}

/** "6:00 pm". */
export function clock(d: Date): string {
  const h = d.getHours()
  return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'am' : 'pm'}`
}

/** "Today", "Tomorrow", or "Mon 18 Nov" (with the year when it is not this year). */
export function dayLabel(d: Date, now = new Date()): string {
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(d) - start(now)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  const base = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`
}

/** "Today at 6:00 pm". */
export function whenLabel(at: string, now = new Date()): string {
  const d = parseLocal(at)
  return d ? `${dayLabel(d, now)} at ${clock(d)}` : at
}

/** "45 min", or "At the time" for 0. */
export function beforeLabel(min: number): string {
  return min === 0 ? 'At the time' : `${min} min`
}

/** "Never" for 0, else "2 d". */
export function repeatLabel(days: number): string {
  return days === 0 ? 'Never' : `${days} d`
}

/** ", then every 2 days" / ", then every day" / "". */
export function repeatPhrase(days: number): string {
  if (days <= 0) return ''
  return days === 1 ? ', then every day' : `, then every ${days} days`
}

/** The quick choices used when the agent gives none: today 6 pm and tomorrow 9 am. */
export function defaultOptions(now = new Date()): { label: string; at: string }[] {
  const at = (add: number, h: number) => toLocalIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + add, h, 0))
  return [
    { label: 'Today 6 pm', at: at(0, 18) },
    { label: 'Tomorrow 9 am', at: at(1, 9) },
  ]
}
