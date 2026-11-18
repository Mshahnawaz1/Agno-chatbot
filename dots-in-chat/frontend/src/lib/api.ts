import { clearToken, getToken } from './token'
import type { Connector, Message, Session, Skill, User } from './types'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let unauthorizedHandler: (() => void) | null = null

/** AuthProvider registers this; it runs after a 401 on an authenticated call. */
export function setOnUnauthorized(fn: (() => void) | null): void {
  unauthorizedHandler = fn
}

/** FastAPI errors are {detail: string} or, for 422, {detail: [{msg}, ...]}. */
async function errorMessage(res: Response): Promise<string> {
  let detail = `Request failed (${res.status})`
  try {
    const body = (await res.json()) as { detail?: unknown }
    if (typeof body.detail === 'string') detail = body.detail
    else if (Array.isArray(body.detail)) {
      const msgs = body.detail
        .map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : ''))
        .filter(Boolean)
      if (msgs.length) detail = msgs.join('; ')
    }
  } catch {
    // body wasn't JSON
  }
  return detail
}

type RequestOptions = RequestInit & {
  /** Skip the bearer token and the 401 handler (login/signup: a 401 is just "wrong password"). */
  public?: boolean
}

async function rawRequest(path: string, { public: isPublic, ...init }: RequestOptions = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (!isPublic) {
    const token = getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(path, { ...init, headers })
  if (!res.ok) {
    if (res.status === 401 && !isPublic) {
      clearToken()
      unauthorizedHandler?.()
    }
    throw new ApiError(res.status, await errorMessage(res))
  }
  return res
}

export async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const res = await rawRequest(path, init)
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

const enc = encodeURIComponent

// ---- auth (public) ----

export async function login(email: string, password: string): Promise<string> {
  const data = await request<{ access_token: string }>('/auth/token', {
    method: 'POST',
    // OAuth2 password flow expects form fields named username/password
    body: new URLSearchParams({ username: email, password }),
    public: true,
  })
  return data.access_token
}

export function signup(email: string, password: string, name?: string | null): Promise<User> {
  return request<User>('/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: name || null }),
    public: true,
  })
}

// ---- app ----

export const me = () => request<User>('/users/me')
export const listSessions = () => request<Session[]>('/sessions')
export const deleteSession = (sessionId: string) =>
  request<void>(`/sessions/${enc(sessionId)}`, { method: 'DELETE' })
export const listMessages = (sessionId: string) =>
  request<Message[]>(`/sessions/${enc(sessionId)}/messages`)

// ---- connectors ----

export const listConnectors = () => request<Connector[]>('/connectors')

/** Returns {url} for OAuth connectors, or {needsApiKey: true} when the server has no OAuth (409). */
export async function authorizeConnector(
  id: string,
): Promise<{ url: string } | { needsApiKey: true }> {
  try {
    return await request<{ url: string }>(`/connectors/${enc(id)}/authorize`, { method: 'POST' })
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) return { needsApiKey: true }
    throw err
  }
}

export const setConnectorKey = (id: string, apiKey: string) =>
  request<void>(`/connectors/${enc(id)}/api-key`, {
    method: 'PUT',
    body: JSON.stringify({ api_key: apiKey }),
  })

export const updateConnector = (id: string, switches: { enabled: boolean }) =>
  request<void>(`/connectors/${enc(id)}`, { method: 'PATCH', body: JSON.stringify(switches) })

export const disconnectConnector = (id: string) =>
  request<void>(`/connectors/${enc(id)}`, { method: 'DELETE' })

export const getConnectorSkill = (id: string) => request<Skill>(`/connectors/${enc(id)}/skill`)

// ---- chat ----

/** Opens the SSE stream; pass the result to readSseEvents. Throws ApiError for non-2xx. */
export function openChatStream(
  input: { message: string } | { action: unknown },
  sessionId: string | null,
  signal?: AbortSignal,
): Promise<Response> {
  return rawRequest('/chat/stream', {
    method: 'POST',
    body: JSON.stringify({ ...input, session_id: sessionId }),
    signal,
  })
}
