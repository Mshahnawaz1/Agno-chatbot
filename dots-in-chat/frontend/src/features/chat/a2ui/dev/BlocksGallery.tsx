/**
 * Dev-only gallery at /dev/blocks: every sample surface in ./samples, drawn by the chat's real
 * renderer and catalog, with the actions they send listed under them. No server, no model.
 *
 * A sample file exports `samples: Sample[]`; add one per block group (samples/<group>.ts).
 */
import { useMemo, useState } from 'react'
import { A2uiSurface } from '@a2ui/react/v0_9'
import { MessageProcessor, type ActionPayload } from '@a2ui/web_core/v1_0'
import type { ReactCatalogComponent } from '@a2ui/react/v0_9'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import { catalogs, LEGACY_ID, tagComponent, upgradeMessage } from '../catalog'
import '../a2ui.css'
import type { Sample } from './sample'
import { blockSchemas } from './schemas'

const files = import.meta.glob<{ samples: Sample[] }>('./samples/*.ts', { eager: true })
const SAMPLES = Object.values(files).flatMap((f) => f.samples)

function SampleView({ sample }: { sample: Sample }) {
  const [log, setLog] = useState<ActionPayload[]>([])
  const processor = useMemo(() => {
    const p = new MessageProcessor<ReactCatalogComponent>(catalogs, (a) => setLog((l) => [...l, a]))
    const errors = p.processMessagesWithErrors([
      sample.legacy
        ? upgradeMessage({ version: '1.0', createSurface: { surfaceId: sample.id, catalogId: LEGACY_ID, components: sample.components } })
        : { version: '1.0', createSurface: { surfaceId: sample.id, components: sample.components.map(tagComponent) } },
      ...(sample.data ? [{ version: '1.0', updateDataModel: { surfaceId: sample.id, path: '/', value: sample.data } }] : []),
    ] as never)
    if (errors.length) console.warn(sample.id, errors)
    return p
  }, [sample])
  const [updated, setUpdated] = useState(false)
  const surface = processor.getSurface(sample.id)
  const applyUpdate = () => {
    processor.processMessages([
      { version: '1.0', updateComponents: { surfaceId: sample.id, components: sample.update?.map(tagComponent) } },
    ] as never)
    setUpdated(true)
  }
  return (
    <article data-sample={sample.id} className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-fg-muted">{sample.title}</h2>
      {sample.user && (
        <div className="flex justify-end">
          <p className="rounded-xl bg-surface-2 px-4 py-2 text-sm">{sample.user}</p>
        </div>
      )}
      {sample.lead && <p className="text-sm text-fg">{sample.lead}</p>}
      <div className="a2ui-host dark">{surface ? <A2uiSurface surface={surface} /> : <p>no surface</p>}</div>
      {sample.update && (
        <button type="button" disabled={updated} onClick={applyUpdate} className="self-start rounded-full border border-border px-3 py-1 text-xs text-fg-muted disabled:opacity-40">
          Agent update
        </button>
      )}
      <ol data-log className="flex flex-col gap-1 font-mono text-[11px] text-fg-subtle">
        {log.map((a, i) => (
          <li key={i}>
            → {a.name} {JSON.stringify(a.context)}
          </li>
        ))}
      </ol>
    </article>
  )
}

export default function BlocksGallery() {
  const params = new URLSearchParams(location.search)
  // ?schemas: the blocks' zod schemas as JSON, for the schema-sync check (e2e/blocks.mjs).
  if (params.has('schemas')) return <pre id="block-schemas">{JSON.stringify(blockSchemas())}</pre>
  const only = params.get('only')
  const shown = only ? SAMPLES.filter((s) => s.id.startsWith(only)) : SAMPLES
  return (
    <main className="min-h-dvh bg-[#090b14] px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-12 [grid-template-columns:repeat(auto-fill,minmax(min(22rem,100%),1fr))]">
        {shown.map((s) => (
          <SampleView key={s.id} sample={s} />
        ))}
      </div>
    </main>
  )
}
