import { useMemo } from 'react'
import { CircleAlert } from 'lucide-react'
import { MessageProcessor, type ActionPayload, type SurfaceModel } from '@a2ui/web_core/v0_9'
import { basicCatalog } from '@a2ui/web_core/v0_9/basic_catalog'
import { A2uiSurface, MarkdownComponentContext, type ReactCatalogComponent } from '@a2ui/react/v0_9'
import { Markdown } from '@/components/Markdown'
import { useUiActions } from '../chatStore'
import { parseMessages, type UiAction } from './parse'
import './a2ui.css'

/** Text components render markdown with the chat's own (safe, no raw HTML) renderer. */
function SurfaceMarkdown({ markdown }: { markdown: string }) {
  return <Markdown className="a2ui-markdown">{markdown}</Markdown>
}

/** The binder resolves {path} bindings before dispatching; resolve any it left as a fallback. */
function resolveContext(value: unknown, surface: SurfaceModel<ReactCatalogComponent> | undefined): unknown {
  if (Array.isArray(value)) return value.map((v) => resolveContext(v, surface))
  if (typeof value !== 'object' || value === null) return value
  const obj = value as Record<string, unknown>
  if (typeof obj.path === 'string' && Object.keys(obj).length === 1) return surface?.dataModel.get(obj.path) ?? null
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, resolveContext(v, surface)]))
}

type Built = {
  surfaces: SurfaceModel<ReactCatalogComponent>[]
  errors: string[]
}

/**
 * Runs a block's messages through a fresh processor. A finished block gets no more messages,
 * so its surfaces are complete once this returns. Never throws: a malformed block must not
 * take the chat down with it.
 */
function build(messages: Record<string, unknown>[] | null, onAction: (a: UiAction) => void): Built {
  if (!messages) return { surfaces: [], errors: ['The interface could not be read.'] }
  try {
    const processor: MessageProcessor<ReactCatalogComponent> = new MessageProcessor<ReactCatalogComponent>(
      [basicCatalog as never],
      (a: ActionPayload) => {
        const action: UiAction = { name: a.name, surfaceId: a.surfaceId }
        const context = resolveContext(a.context ?? {}, processor.getSurface(a.surfaceId))
        if (context && typeof context === 'object' && Object.keys(context).length) {
          action.context = context as Record<string, unknown>
        }
        onAction(action)
      },
    )
    const errors = processor.processMessagesWithErrors(messages).map((e) => {
      const body = (e as { error?: { message?: string } }).error
      return body?.message ?? 'Invalid interface message'
    })
    if (errors.length) console.warn('A2UI errors:', errors, messages)
    return { surfaces: Array.from(processor.getSurfaces().values()), errors }
  } catch (err) {
    console.warn('A2UI block failed:', err, messages)
    return { surfaces: [], errors: [err instanceof Error ? err.message : 'Invalid interface'] }
  }
}

/**
 * One `<a2ui>` block: its own processor (so surface ids only need to be unique per block), its
 * surfaces, and clicks sent back to the agent as the next user message.
 */
export default function A2uiBlock({ raw }: { raw: string }) {
  const { sendAction, busy } = useUiActions()
  // Keyed on the raw text (sendAction is stable): while the reply keeps streaming after this
  // block, the block and what the user typed into it stay as they are.
  const built = useMemo(() => build(parseMessages(raw), sendAction), [raw, sendAction])

  if (built.surfaces.length === 0) {
    return built.errors.length ? (
      <p className="my-3 flex items-center gap-2 text-sm text-fg-subtle">
        <CircleAlert className="size-4 shrink-0 text-danger" aria-hidden />
        Couldn't show the interactive part of this reply.
      </p>
    ) : null
  }

  return (
    <MarkdownComponentContext.Provider value={SurfaceMarkdown}>
      {/* inert while a reply streams: a click then would be dropped (one run at a time). */}
      <div className="a2ui-host a2ui-dark my-4 flex flex-col gap-3" inert={busy || undefined} aria-busy={busy || undefined}>
        {built.surfaces.map((s) => (
          <div key={s.id} className="a2ui-surface">
            <A2uiSurface surface={s} />
          </div>
        ))}
      </div>
    </MarkdownComponentContext.Provider>
  )
}
