/**
 * The catalogs the chat renders, one per id, like the server's (app/a2ui/catalog.py):
 *   - the A2UI v1.0 basic catalog, drawn with shadcn/ui (all 18 components);
 *   - the official VegaChart catalog;
 *   - the chat blocks (../blocks), our own catalog.
 * A surface names no catalog of its own: each component names the one it is from, so a basic
 * Column can hold a VegaChart and a block. Ids, component names and props match the server's
 * catalogs, which the agent's prompt and the server's validator are generated from.
 */
import { BASIC_FUNCTIONS, Catalog } from '@a2ui/web_core/v1_0'
import type { ReactCatalogComponent } from '@a2ui/react/v0_9'
import { BLOCKS } from '../blocks'
import { VegaChart } from './chart'
import { Icon, Image, Text } from './content'
import { Button, CheckBox, ChoicePicker, DateTimeInput, Slider, TextField } from './inputs'
import { Card, Column, Divider, List, Row, Tabs } from './layout'
import { AudioPlayer, Modal, Video } from './media'
import { CLIENT_INFO } from './functions'

export const BASIC_ID = 'https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json'
export const VEGA_ID = 'https://a2ui.org/specification/v1_0/catalogs/vegachart/catalog.json'
export const BLOCKS_ID = 'dots-in-chat/blocks/v1'
/** The one merged catalog the chat had before mixed catalogs; stored surfaces still name it. */
export const LEGACY_ID = 'dots-in-chat/chat/v1'

const basic = new Catalog<ReactCatalogComponent>(
  BASIC_ID,
  '1.0',
  [
    Text, Image, Icon, Video, AudioPlayer,
    Row, Column, List, Card, Tabs, Modal, Divider,
    Button, TextField, CheckBox, ChoicePicker, Slider, DateTimeInput,
  ] as ReactCatalogComponent[],
  [...BASIC_FUNCTIONS, CLIENT_INFO],
)
const vega = new Catalog<ReactCatalogComponent>(VEGA_ID, '1.0', [VegaChart] as ReactCatalogComponent[], [])
const blocks = new Catalog<ReactCatalogComponent>(BLOCKS_ID, '1.0', BLOCKS, [])

/** Every catalog, in the order the capabilities list them. */
export const catalogs = [basic, vega, blocks]

const catalogOf = new Map(catalogs.flatMap((c) => [...c.components.keys()].map((name) => [name, c.id] as const)))

type Wire = Record<string, unknown>

/** The component with the catalog it is from, unless it already names one. */
export function tagComponent(c: Wire): Wire {
  const tagged = tagCalls(c) as Wire
  const id = catalogOf.get(String(tagged.component))
  return id && !('catalogId' in tagged) ? { ...tagged, catalogId: id } : tagged
}

/** Every function call (`call` / `@call`) names its catalog, except system functions; the functions are the basic catalog's. */
function tagCalls(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(tagCalls)
  if (node && typeof node === 'object') {
    const out = Object.fromEntries(Object.entries(node).map(([k, v]) => [k, tagCalls(v)])) as Wire
    const name = String(out['@call'] ?? out.call ?? '')
    // system functions (@index, ...) belong to no catalog and must not name one
    return name && !name.startsWith('@') && !('catalogId' in out) ? { ...out, catalogId: BASIC_ID } : out
  }
  return node
}

/**
 * A stored surface message from before mixed catalogs, in today's shape (the server does the
 * same in app/a2ui/catalog.py `upgrade_message`): `createSurface` named one merged catalog;
 * now it names none and each component names its own. `updateComponents` of those turns named
 * none at all. Anything else passes through unchanged.
 */
export function upgradeMessage<T extends Wire>(message: T): T {
  const create = message.createSurface as Wire | undefined
  if (create && create.catalogId === LEGACY_ID) {
    const rest = Object.fromEntries(Object.entries(create).filter(([k]) => k !== 'catalogId'))
    // an empty components list is invalid: the official examples send theirs in updateComponents
    const components = create.components as Wire[] | undefined
    return { ...message, createSurface: components ? { ...rest, components: components.map(tagComponent) } : rest }
  }
  const update = message.updateComponents as Wire | undefined
  if (update) return { ...message, updateComponents: { ...update, components: ((update.components as Wire[]) ?? []).map(tagComponent) } }
  return message
}
