import type { Session } from './types'

/** Seconds -> "1.23 s" (same as the old UI). */
export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(Number(seconds))) return '-'
  return `${Number(seconds).toFixed(2)} s`
}

/**
 * Parse a backend timestamp. SQLite CURRENT_TIMESTAMP writes "YYYY-MM-DD HH:MM:SS" in UTC
 * with no timezone marker, so treat zone-less values as UTC.
 */
export function parseTimestamp(value: string): Date {
  let s = value.trim().replace(' ', 'T')
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) s += 'Z'
  return new Date(s)
}

export type SessionGroup = { label: string; sessions: Session[] }

const DAY = 24 * 60 * 60 * 1000

/** Groups by updated_at into Today / Yesterday / Previous 7 days / Previous 30 days / Older. Empty groups omitted. */
export function groupSessionsByDate(sessions: Session[], now: Date = new Date()): SessionGroup[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const groups: SessionGroup[] = [
    { label: 'Today', sessions: [] },
    { label: 'Yesterday', sessions: [] },
    { label: 'Previous 7 days', sessions: [] },
    { label: 'Previous 30 days', sessions: [] },
    { label: 'Older', sessions: [] },
  ]

  for (const s of sessions) {
    const t = parseTimestamp(s.updated_at).getTime()
    let i: number
    if (Number.isNaN(t) || t < startOfToday - 30 * DAY) i = 4
    else if (t >= startOfToday) i = 0
    else if (t >= startOfToday - DAY) i = 1
    else if (t >= startOfToday - 7 * DAY) i = 2
    else i = 3
    groups[i].sessions.push(s)
  }
  return groups.filter((g) => g.sessions.length > 0)
}
