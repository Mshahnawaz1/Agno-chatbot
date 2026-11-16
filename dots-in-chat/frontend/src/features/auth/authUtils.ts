import { ApiError } from '@/lib/api'

/** Only allow same-origin absolute paths ("/x", never "//host" or "/\host"). */
export function safeNext(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')) return raw
  return '/'
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError || err instanceof Error) return err.message || 'Something went wrong.'
  return 'Something went wrong. Please try again.'
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
