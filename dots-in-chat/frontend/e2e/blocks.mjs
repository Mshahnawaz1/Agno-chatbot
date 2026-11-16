/**
 * End-to-end checks for the chat blocks, against the dev gallery (/dev/blocks), no server or model:
 *   1. schema sync: each block's zod schema (client) matches its JSON schema (server catalog)
 *   2. every sample renders, with no console errors
 *   3. interactions: each block's live maths and the events it sends
 *
 * Run with the dev server up (npm run dev):
 *   node e2e/blocks.mjs [baseUrl]          default http://localhost:5173
 * Uses Playwright's Chromium; set PW_CHROMIUM to a chrome binary to use another one.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const BLOCKS_DIR = fileURLToPath(new URL('../../app/a2ui/catalogs/blocks/', import.meta.url))

const results = []
async function check(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
  } catch (e) {
    results.push({ name, ok: false, error: e instanceof Error ? e.message : String(e) })
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

/** A JSON schema property, reduced to the shape dev/schemas.ts produces. */
function jsonShape(s) {
  if (s.type === 'array') return { type: 'array', items: jsonShape(s.items ?? {}) }
  if (s.type === 'object') {
    const properties = Object.fromEntries(Object.entries(s.properties ?? {}).map(([k, v]) => [k, jsonShape(v)]))
    return { type: 'object', properties, required: [...(s.required ?? [])].sort() }
  }
  if (s.type === 'integer') return { type: 'number' }
  if (s.enum || s.const) return { type: 'string' }
  return { type: s.type ?? 'unknown' }
}

function serverSchemas() {
  const out = {}
  for (const f of readdirSync(BLOCKS_DIR).filter((f) => f.endsWith('.json'))) {
    const doc = JSON.parse(readFileSync(BLOCKS_DIR + f, 'utf8'))
    for (const [name, schema] of Object.entries(doc.components)) {
      const { component: _c, ...properties } = schema.properties
      out[name] = jsonShape({
        type: 'object',
        properties,
        required: schema.required.filter((r) => r !== 'component'),
      })
    }
  }
  return out
}

function diff(a, b, path = '') {
  if (JSON.stringify(a) === JSON.stringify(b)) return []
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((k) => diff(a[k], b[k], `${path}.${k}`))
  }
  return [`${path || '.'}: client ${JSON.stringify(a)} ≠ server ${JSON.stringify(b)}`]
}

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error' || (m.type() === 'warning' && !m.text().includes('Lit is in dev mode'))) errors.push(m.text())
})

/** The actions a sample's surface has sent so far. */
async function actions(sample) {
  const lines = await page.locator(`article[data-sample="${sample}"] [data-log] li`).allTextContents()
  return lines.map((l) => {
    const m = /^→ (\S+) (.*)$/.exec(l.trim())
    return { name: m[1], context: JSON.parse(m[2]) }
  })
}
const card = (sample) => page.locator(`article[data-sample="${sample}"]`)

await check('schema sync: client zod = server JSON for every block', async () => {
  await page.goto(`${BASE}/dev/blocks?schemas`)
  await page.waitForSelector('#block-schemas')
  const client = JSON.parse(await page.locator('#block-schemas').textContent())
  const server = serverSchemas()
  const problems = diff(client, server)
  assert(Object.keys(server).length > 0, 'no server block schemas')
  assert(problems.length === 0, problems.join('\n'))
})

await check('every sample renders without console errors', async () => {
  errors.length = 0
  await page.goto(`${BASE}/dev/blocks`, { waitUntil: 'networkidle' })
  await page.waitForSelector('article[data-sample]')
  await page.waitForTimeout(500)
  const n = await page.locator('article[data-sample]').count()
  assert(n > 0, 'no samples')
  const missing = await page.locator('article[data-sample]:has-text("no surface")').count()
  assert(missing === 0, `${missing} samples have no surface`)
  assert(errors.length === 0, errors.join('\n'))
})

await check('GrowthCalculator: dragging years recomputes; Suggestions sends what is on screen', async () => {
  const c = card('growth-sip')
  assert((await c.textContent()).includes('₹50.5L'), '15-year value should be ₹50.5L')
  const years = c.getByRole('slider').nth(2)
  await years.focus()
  for (let i = 0; i < 5; i++) await years.press('ArrowRight')
  const text = await c.textContent()
  assert(text.includes('₹99.9L') && text.includes('₹24L') && text.includes('₹75.9L'), '20-year tiles wrong')
  assert(text.includes('dragged'), 'no "dragged" pill')
  await c.getByRole('button', { name: 'Make it 20 years' }).click()
  const [say] = await actions('growth-sip')
  assert(say?.name === 'say' && say.context.text === 'Make it 20 years', 'say not sent')
  assert(say.context.onScreen.calc.years === 20, 'onScreen does not carry the dragged years')
})

await check('Agent update: block shows "changed", new suggestions are tappable again', async () => {
  const c = card('growth-sip')
  await c.getByRole('button', { name: 'Agent update' }).click()
  const text = await c.textContent()
  assert(text.includes('changed') && text.includes('₹99.9L'), 'no "changed" pill or values not reset to the update')
  const chip = c.getByRole('button', { name: 'Add a lump sum' })
  assert(await chip.isEnabled(), 'new suggestions stay disabled after the agent update')
})

// Further interaction checks are added per block in e2e/blocks.checks.mjs.
try {
  const { default: more } = await import('./blocks.checks.mjs')
  await more({ page, check, assert, actions, card })
} catch (e) {
  if (e?.code !== 'ERR_MODULE_NOT_FOUND') throw e
}

await browser.close()
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.error.replaceAll('\n', '\n      ')}`}`)
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
