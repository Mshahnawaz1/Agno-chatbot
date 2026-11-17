/**
 * One chat's A2UI renderer state and its line to the agent, with no React in it (so
 * `frontend/tests/renderer.test.mjs` runs it in plain Node).
 *
 * It wraps web_core's MessageProcessor and covers what flows back to the agent:
 * - `error` messages: validation and expression errors the renderer hits are reported once
 *   each, only for surfaces drawn from a live reply (replaying history must never call the model);
 * - `sendDataModel`: `dataModel()` is the `a2uiRendererDataModel` of the surfaces that opted in;
 * - the capabilities handshake: `capabilities()` is `a2uiRendererCapabilities`, from the real catalog;
 * - function RPC: `runCall` executes the agent's `callRendererFunction` (web_core enforces
 *   allowedCallers and requiresUserActivation) and every response or `callAgentFunction` leaves
 *   through `transport`; the agent's replies are applied when they arrive.
 */
import { MessageProcessor } from '@a2ui/web_core/v1_0'
import type { Catalog, ComponentApi } from '@a2ui/web_core/v1_0'

/** A v1.0 wire message, either direction. */
export type WireMessage = { version: string } & Record<string, unknown>

/** What the agent receives for a click: web_core's ActionPayload, as the server expects it. */
export type Action = Record<string, unknown>

export type RendererIo = {
  sendAction: (action: Action) => void
  /** A renderer `error` message worth the agent's attention. */
  reportError: (error: WireMessage) => void
  /** Sends a renderer-to-agent RPC message; resolves with the agent's replies to apply. */
  transport?: (message: WireMessage) => Promise<WireMessage[]>
}

type ErrorPayload = { code?: string; message?: string; surfaceId?: string; details?: unknown }

/** web_core's error payload as a renderer-to-agent `error` message. */
export function errorMessage(e: ErrorPayload): WireMessage {
  const first = Array.isArray(e.details) ? (e.details[0] as { path?: unknown } | undefined) : undefined
  return {
    version: '1.0',
    error: {
      code: e.code ?? 'UNKNOWN_ERROR',
      message: String(e.message ?? 'Unknown error'),
      ...(e.surfaceId ? { surfaceId: e.surfaceId } : {}),
      ...(typeof first?.path === 'string' ? { path: first.path } : {}),
    },
  }
}

export class Renderer<T extends ComponentApi = ComponentApi> {
  processor: MessageProcessor<T>
  /** How many of the feed's messages are applied, and the last one applied. */
  applied = 0
  last: WireMessage | undefined
  /** Bumped whenever messages are applied, so surfaces re-render. */
  version = 0
  readonly listeners = new Set<() => void>()
  io: RendererIo
  private readonly catalogs: Catalog<T>[]
  /** Surfaces created by a live reply: only their errors go to the agent. */
  private liveSurfaces = new Set<string>()
  private live = false
  private reported = new Set<string>()

  constructor(catalog: Catalog<T> | Catalog<T>[], io: RendererIo) {
    this.catalogs = Array.isArray(catalog) ? catalog : [catalog]
    this.io = io
    this.processor = this.build()
  }

  private build(): MessageProcessor<T> {
    const p = new MessageProcessor<T>(this.catalogs, (a) => this.io.sendAction(a as Action), {
      outboundListener: (m) => this.send(m as WireMessage),
    })
    // Runtime errors (an expression that fails) arrive on the surface; apply-time ones too.
    p.model.onError.subscribe((e) => this.onError(e as ErrorPayload))
    p.onSurfaceCreated((s) => {
      if (this.live) this.liveSurfaces.add(s.id)
      s.onError.subscribe((e) => this.onError(e as ErrorPayload))
    })
    return p
  }

  /** Drops everything and starts over (the feed was replaced, e.g. history refetched). */
  reset() {
    this.processor.dispose()
    this.liveSurfaces.clear()
    this.reported.clear()
    this.processor = this.build()
    this.applied = 0
    this.last = undefined
  }

  /**
   * Applies messages. `live` is true for a reply streaming now. A `callRendererFunction` in a
   * stored reply is not run again (it ran when it arrived).
   */
  apply(messages: WireMessage[], live: boolean) {
    this.live = live
    try {
      const batch = live ? messages : messages.filter((m) => !('callRendererFunction' in m))
      this.processor.processMessagesWithErrors(batch)
    } finally {
      this.live = false
    }
  }

  private onError(e: ErrorPayload) {
    const wire = errorMessage(e)
    const body = wire.error as { code: string; surfaceId?: string; path?: string; message: string }
    const known = body.surfaceId && this.liveSurfaces.has(body.surfaceId)
    if (!(this.live || known)) {
      console.warn('A2UI renderer error (not sent to the agent):', body)
      return
    }
    const key = `${body.code}|${body.surfaceId}|${body.path}|${body.message}`
    if (this.reported.has(key)) return
    this.reported.add(key)
    this.io.reportError(wire)
  }

  /** `a2uiRendererCapabilities`: what this renderer can draw, from the catalogs it really has. */
  capabilities() {
    return this.processor.getRendererCapabilities({ versions: ['1.0'] })
  }

  /** `a2uiRendererDataModel`: the data models of surfaces that set `sendDataModel`, or undefined. */
  dataModel(): Record<string, unknown> | undefined {
    return this.processor.getRendererDataModel('1.0')
  }

  /** Runs a `callRendererFunction` from the agent. Its response leaves through `transport`. */
  async runCall(message: WireMessage) {
    // Not user-activated: an agent's call never is, so requiresUserActivation functions refuse.
    await this.processor.processMessagesAsync([message as never], { isUserActivated: false })
  }

  /** Calls one of the agent's functions (`callAgentFunction`); resolves with its value. */
  callAgent<R = unknown>(surfaceId: string, name: string, args: Record<string, unknown> = {}, timeoutMs?: number) {
    return this.processor.callAgentFunction<R>(
      surfaceId,
      { '@call': name, catalogId: this.catalogs[0].id, args } as never,
      timeoutMs ? { timeoutMs } : undefined,
    )
  }

  private async send(message: WireMessage) {
    if (!this.io.transport) return
    const replies = await this.io.transport(message)
    for (const reply of replies) this.processor.processMessages(reply as never)
  }
}
