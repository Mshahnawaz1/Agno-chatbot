/**
 * Replays the 43 official A2UI v1.0 basic-catalog examples (tests/fixtures/a2ui_examples/) through the
 * app's real renderer: MessageProcessor + the chat catalog + <A2uiSurface> in Chromium.
 * Each example's catalogId is rewritten to the chat's own id (the chat registers one catalog).
 * Per example: every message applies with no processor error, no console error, and something
 * is drawn. Known gaps are listed in tests/fixtures/known_gaps.json ("renderer"); the run fails
 * if a known gap starts passing or an unknown one fails.
 *
 *   node e2e/examples.mjs          (from dots-in-chat/frontend)
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { open } from './replay/harness.mjs'

const DIR = fileURLToPath(new URL('../../tests/fixtures/a2ui_examples/', import.meta.url))
const CATALOG_ID = 'dots-in-chat/chat/v1'
const KNOWN = JSON.parse(readFileSync(fileURLToPath(new URL('../../tests/fixtures/known_gaps.json', import.meta.url)), 'utf8'))

const { page, consoleErrors, close } = await open()
const rows = []
let bad = 0
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()) {
  const ex = JSON.parse(readFileSync(DIR + f, 'utf8'))
  const messages = ex.messages.map((m) =>
    m.createSurface ? { ...m, createSurface: { ...m.createSurface, catalogId: CATALOG_ID } } : m,
  )
  consoleErrors.length = 0
  await page.evaluate(() => window.__replay.reset())
  const problems = []
  let surfaces = []
  for (const m of messages) {
    const r = await page.evaluate((m) => window.__replay.apply([m]), m)
    surfaces = r.surfaces
    problems.push(...r.errors)
  }
  const types = [...new Set(messages.flatMap((m) => (m.updateComponents?.components ?? m.createSurface?.components ?? []).map((c) => c.component)))]
  for (const t of types) if (!(await page.evaluate((t) => window.__replay.catalogHas(t), t))) problems.push(`component ${t} is not in the chat catalog (renderer draws nothing for it)`)
  const emptySrc = await page.evaluate(() => document.querySelectorAll('img[src=""]').length)
  if (emptySrc) problems.push(`${emptySrc} <img> left with an empty src at the end`)
  const text = await page.evaluate(() => document.body.innerText.trim().length)
  if (!surfaces.length) problems.push('no surface created')
  if (!text) problems.push('nothing drawn')
  problems.push(...consoleErrors.map((e) => 'console: ' + e.slice(0, 200)))
  rows.push({ name: f.replace('.json', ''), ok: problems.length === 0, problems })
}

// The two examples that use `@checks` run fine once spelled like web_core 0.15.0 (`checks`).
const norm = (n) => Array.isArray(n) ? n.map(norm) : n && typeof n === 'object' ? Object.fromEntries(Object.entries(n).map(([k, v]) => [{ '@checks': 'checks', '@accessibility': 'accessibility' }[k] ?? k, norm(v)])) : n
for (const name of ['login-form', 'advanced-form-validator']) {
  const ex = JSON.parse(readFileSync(DIR + name + '.json', 'utf8'))
  const messages = norm(ex.messages).map((m) => (m.createSurface ? { ...m, createSurface: { ...m.createSurface, catalogId: CATALOG_ID } } : m))
  consoleErrors.length = 0
  await page.evaluate(() => window.__replay.reset())
  const problems = []
  for (const m of messages) problems.push(...(await page.evaluate((m) => window.__replay.apply([m]), m)).errors)
  const drawn = await page.evaluate(() => document.body.innerText.trim().length)
  if (!drawn) problems.push('nothing drawn')
  console.log(`${problems.length ? 'FAIL' : 'pass'}`.padEnd(16) + ` ${name} (normalized @checks -> checks)${problems.length ? ' :: ' + problems[0].slice(0, 200) : ''}`)
  if (problems.length) bad++
}
await close()

for (const r of rows) {
  const known = KNOWN.renderer?.[r.name]
  const status = r.ok ? (known ? 'UNEXPECTED PASS' : 'pass') : known ? 'known gap' : 'FAIL'
  if (status === 'FAIL' || status === 'UNEXPECTED PASS') bad++
  console.log(`${status.padEnd(16)} ${r.name}${r.problems.length ? '  :: ' + r.problems[0].slice(0, 200) : ''}`)
}
console.log(
  `\nrenderer replay: ${rows.filter((r) => r.ok).length}/${rows.length} clean, ${rows.filter((r) => !r.ok).length} with problems, ${bad} unexpected`,
)
process.exit(bad ? 1 : 0)
