/**
 * Express -> real renderer, end to end without a model: tests/compile_scenarios.py compiles
 * Express replies with the app's server code; every message is then applied one at a time (as the
 * SSE stream delivers it) to the real renderer, and the drawn page is checked.
 *
 *   node e2e/pipeline.mjs          (from dots-in-chat/frontend; uses PYTHON or ../../.venv/bin/python)
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { open } from './replay/harness.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const candidates = [process.env.PYTHON, root + '../.venv/bin/python', root + '../../../../.venv/bin/python', '/home/frontier/learning/.venv/bin/python'].filter(Boolean)
const python = candidates.find((p) => existsSync(p)) ?? 'python3'
const scenarios = JSON.parse(
  execFileSync(python, ['tests/compile_scenarios.py'], { cwd: root, env: { ...process.env, PYTHONPATH: root }, maxBuffer: 1 << 26 }).toString(),
)

const { page, consoleErrors, close } = await open()
let failed = 0
for (const sc of scenarios) {
  consoleErrors.length = 0
  await page.evaluate(() => window.__replay.reset())
  const problems = [...sc.errors.map((e) => 'compile: ' + e.slice(0, 160))]
  for (const m of sc.messages) problems.push(...(await page.evaluate((m) => window.__replay.apply([m]), m)).errors)
  // Charts and lazy parts need a moment.
  await page.waitForTimeout(sc.name === 'chart block' ? 1500 : 100)
  const text = await page.evaluate(() => document.body.innerText)
  for (const t of sc.expect) if (!text.includes(t)) problems.push(`missing text ${JSON.stringify(t)} in ${JSON.stringify(text.trim().slice(0, 120))}`)
  if (sc.name === 'chart block' && !(await page.locator('svg, canvas').count())) problems.push('no chart drawn')
  if (sc.name.startsWith('form with checks')) {
    const btn = page.locator('button', { hasText: 'Send' })
    if (!(await btn.isDisabled())) problems.push('Send should start disabled')
    await page.locator('input').first().fill('a@b.co')
    if (await btn.isDisabled()) problems.push('Send should enable for a valid email')
    await btn.click()
    const sent = await page.evaluate(() => window.__replay.actions())
    if (sent[0]?.name !== 'send' || sent[0]?.context?.e !== 'a@b.co') problems.push('action context wrong: ' + JSON.stringify(sent[0]))
  }
  if (sc.name.startsWith('@index() as')) {
    if (!/1[\s\S]*2/.test(text)) problems.push('index text not 1, 2')
  }
  problems.push(...consoleErrors.map((e) => 'console: ' + e.slice(0, 160)))
  console.log(`${problems.length ? 'FAIL' : 'pass'}  ${sc.name}${problems.length ? '  :: ' + problems.join(' || ') : ''}`)
  if (problems.length) failed++
}
await close()
console.log(`\npipeline: ${scenarios.length - failed}/${scenarios.length} pass`)
process.exit(failed ? 1 : 0)
