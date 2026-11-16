/**
 * Chat blocks: ready-made interactive cards (calculators, approvals, batch actions, charts)
 * from the design reference. Each is a custom component of the chat catalog; its JSON schema
 * for the server is in app/a2ui/catalogs/blocks/<file>.json and must match the zod schema here.
 *
 * Every component exported from a block file in this folder is registered: a block file only
 * exports components made with createComponentImplementation.
 */
import type { ReactCatalogComponent } from '@a2ui/react/v0_9'

const files = import.meta.glob<Record<string, unknown>>(['./*.tsx', '!./kit.tsx'], { eager: true })

function isComponent(v: unknown): v is ReactCatalogComponent {
  return !!v && typeof v === 'object' && typeof (v as { name?: unknown }).name === 'string' && 'schema' in v
}

export const BLOCKS: ReactCatalogComponent[] = Object.values(files)
  .flatMap((m) => Object.values(m))
  .filter(isComponent)
  .sort((a, b) => a.name.localeCompare(b.name))
