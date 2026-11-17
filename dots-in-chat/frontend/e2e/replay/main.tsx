/**
 * Replay harness (tests only). Exposes window.__replay: build a fresh MessageProcessor with the
 * app's real catalog, apply messages (all at once, or one at a time), and draw each surface with
 * the app's real <A2uiSurface>. Used by e2e/examples.mjs and e2e/audit.mjs.
 */
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { A2uiSurface } from '@a2ui/react/v0_9'
import { MessageProcessor, type ActionPayload } from '@a2ui/web_core/v1_0'
import type { ReactCatalogComponent } from '@a2ui/react/v0_9'
import '@fontsource/poppins/400.css'
import { catalog } from '@/features/chat/a2ui/catalog'
import '@/features/chat/a2ui/a2ui.css'

type Msg = Record<string, unknown>
const root = createRoot(document.getElementById('root')!)
let processor: MessageProcessor<ReactCatalogComponent>
const actions: ActionPayload[] = []
const errors: string[] = []

function draw() {
  const ids = [...processor.getSurfaces().keys()]
  flushSync(() =>
    root.render(
      <div>
        {ids.map((id) => (
          <div key={id} data-surface={id} className="a2ui-host dark">
            <A2uiSurface surface={processor.getSurface(id)!} />
          </div>
        ))}
      </div>,
    ),
  )
  return ids
}

function show(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object') {
    const o = e as { message?: unknown; error?: unknown }
    if (typeof o.message === 'string') return o.message
    if (o.error instanceof Error) return o.error.message
    return JSON.stringify(e)
  }
  return String(e)
}

const api = {
  reset() {
    actions.length = 0
    errors.length = 0
    flushSync(() => root.render(null))
    processor = new MessageProcessor<ReactCatalogComponent>([catalog], (a) => actions.push(a))
  },
  /** Applies messages one call at a time, as a stream delivers them; returns processor errors. */
  apply(messages: Msg[]) {
    const errs = processor.processMessagesWithErrors(messages as never).map(show)
    errors.push(...errs)
    return { errors: errs, surfaces: draw() }
  },
  actions: () => actions,
  catalogHas: (name: string) => catalog.components.has(name),
  allErrors: () => errors,
  dataModel(surfaceId: string, path = '/') {
    return processor.getSurface(surfaceId)?.dataModel.get(path)
  },
}
;(window as unknown as { __replay: typeof api }).__replay = api
document.title = 'ready'
