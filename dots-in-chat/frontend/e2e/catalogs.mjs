/**
 * End-to-end scenarios for mixed catalogs, against the dev gallery (/dev/blocks), no server or model:
 *   1. one surface mixes basic, VegaChart and chat-block components, each resolved by its own catalogId
 *   2. a basic Modal opens its content in a dialog
 *   3. a surface stored with the old single catalog id still renders (upgradeMessage)
 *   4. a server-lowered macro (expansion root carrying metadata) renders
 *
 * Run with the dev server up (npm run dev):
 *   node e2e/catalogs.mjs [baseUrl]          default http://localhost:5173
 */
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://localhost:5173'
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

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => {
  if (m.type() === 'error' || (m.type() === 'warning' && !m.text().includes('Lit is in dev mode'))) errors.push(m.text())
})
const card = (id) => page.locator(`article[data-sample="${id}"]`)

await page.goto(`${BASE}/dev/blocks`, { waitUntil: 'networkidle' })
await page.waitForSelector('article[data-sample]')
await page.waitForTimeout(800)

await check('mixed surface: basic Card + VegaChart + GrowthCalculator render, no console errors', async () => {
  const c = card('mixed-catalogs')
  assert(!(await c.textContent()).includes('no surface'), 'the surface was not created')
  assert((await c.textContent()).includes('Savings plan'), 'basic Text missing')
  assert((await c.locator('svg, canvas').count()) > 0, 'VegaChart drew nothing')
  assert((await c.textContent()).includes('₹50.5L'), 'GrowthCalculator block missing or wrong')
  assert(errors.length === 0, errors.join('\n'))
})

await check('basic Modal opens its content in a dialog', async () => {
  await card('mixed-catalogs').getByRole('button', { name: 'Show assumptions' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ timeout: 3000 })
  assert((await dialog.textContent()).includes('steady 12%'), 'modal content missing')
  await page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'detached', timeout: 3000 })
})

await check('a surface stored with the old single catalog id renders', async () => {
  const c = card('legacy-surface')
  const text = await c.textContent()
  assert(!text.includes('no surface'), 'legacy surface was not created')
  assert(text.includes('Stored with the old single catalog id.'), 'legacy basic Text missing')
  assert(text.includes('₹') || (await c.getByRole('slider').count()) > 0, 'legacy block missing')
})

await check('a lowered macro (root with metadata) renders as plain basic components', async () => {
  const text = await card('macro-lowered').textContent()
  assert(text.includes('Heads up') && text.includes('Prices change daily.'), 'macro expansion missing')
  assert(errors.length === 0, errors.join('\n'))
})

await browser.close()
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.error.replaceAll('\n', '\n      ')}`}`)
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
