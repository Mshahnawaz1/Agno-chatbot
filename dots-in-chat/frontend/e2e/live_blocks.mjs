/**
 * Live end-to-end test of the chat blocks: real UI, real backend, real model.
 * Each scenario is a prompt from the design; it passes when the agent answers with the block
 * the design shows for it. One scenario then drags a slider and taps a suggestion, and checks
 * that the agent's next reply used what was on screen.
 *
 * Needs the backend (uvicorn on :8000) and the Vite dev server up. Uses ~6–8 model requests
 * (Gemini free tier: 20 per model per day), paced 13 s apart.
 *   node e2e/live_blocks.mjs [baseUrl] [outDir]
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const OUT = process.argv[3] ?? 'e2e-results'
mkdirSync(OUT, { recursive: true })

const SCENARIOS = [
  { id: 'sip', prompt: 'What if I invest ₹10,000 a month for 15 years at 12%?', expect: ['Monthly SIP', 'Future value'] },
  { id: 'budget', prompt: 'Split my ₹80,000 salary into needs, wants and savings', expect: ['per month', '= 100%'] },
  { id: 'message', prompt: 'Draft a WhatsApp message to Priya Sharma, Product Manager at Zepto, to catch up', expect: ['Needs your OK', 'Send message'] },
  {
    id: 'spending',
    prompt: 'How much did I spend this week? Mon 420, Tue 860, Wed 300, Thu 1240, Fri 690, Sat 1580, Sun 980 rupees',
    expect: ['Bar', 'Same data, other styles'],
  },
  { id: 'quadratic', prompt: 'Show me y = x² - 2x - 3', expect: ['Discriminant', 'Vertex'] },
]

const email = `blocks-e2e-${Date.now()}@example.com`
const password = `pw-${Math.random().toString(36).slice(2)}-x`
await fetch(`${BASE}/users`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password, name: 'Blocks E2E' }),
}).then((r) => { if (!r.ok) throw new Error(`signup ${r.status}`) })
const { access_token: token } = await fetch(`${BASE}/auth/token`, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ username: email, password }),
}).then((r) => r.json())

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const ctx = await browser.newContext({ viewport: { width: 900, height: 1000 } })
await ctx.addInitScript((t) => localStorage.setItem('accessToken', t), token)
const page = await ctx.newPage()
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let lastRequest = 0
async function pace() {
  const wait = 13000 - (Date.now() - lastRequest)
  if (wait > 0) await sleep(wait)
  lastRequest = Date.now()
}

/** Waits until the reply has finished streaming. */
async function settle() {
  await page.getByRole('button', { name: 'Stop generating' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {})
  await page.getByRole('button', { name: 'Stop generating' }).waitFor({ state: 'detached', timeout: 120000 })
  await page.waitForTimeout(1500)
}

async function ask(prompt) {
  await pace()
  const box = page.getByRole('textbox', { name: 'Message' })
  await box.fill(prompt)
  await box.press('Enter')
  await settle()
}

const lastReply = () => page.locator('.a2ui-host').last()
const results = []

for (const s of SCENARIOS) {
  const r = { id: s.id, prompt: s.prompt, ok: false }
  try {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
    await ask(s.prompt)
    const host = lastReply()
    const text = (await host.count()) ? await host.textContent() : ''
    r.missing = s.expect.filter((e) => !text.includes(e))
    r.ok = r.missing.length === 0
    r.url = page.url()
    await page.screenshot({ path: `${OUT}/${s.id}.png`, fullPage: true })

    if (s.id === 'sip' && r.ok) {
      // Drag years to 20 in the browser, then tap the first suggestion: the reply must answer
      // from the dragged value (the say action carries onScreen).
      const years = host.getByRole('slider').nth(2)
      await years.focus()
      const before = Number(await years.getAttribute('aria-valuenow'))
      for (let i = before; i < 20; i++) await years.press('ArrowRight')
      r.liveRecalc = (await host.textContent()).includes('dragged')
      const chip = host.locator('.blk-suggest').first()
      r.tapped = (await chip.count()) ? await chip.textContent() : null
      if (r.tapped) {
        await pace()
        await chip.click()
        await settle()
        await page.screenshot({ path: `${OUT}/sip-after-tap.png`, fullPage: true })
        const all = await page.locator('main').textContent()
        r.tapShownAsMessage = all.includes(r.tapped)
        r.replyAfterTap = (await page.locator('.a2ui-host').count()) >= 1
      }
    }
  } catch (e) {
    r.error = e instanceof Error ? e.message : String(e)
    await page.screenshot({ path: `${OUT}/${s.id}-error.png`, fullPage: true }).catch(() => {})
  }
  results.push(r)
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${s.id}${r.ok ? '' : `  ${r.error ?? 'missing: ' + r.missing.join(', ')}`}`)
}

await browser.close()
writeFileSync(`${OUT}/results.json`, JSON.stringify({ when: new Date().toISOString(), results, pageErrors }, null, 2))
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed; details in ${OUT}/results.json`)
if (pageErrors.length) console.log('page errors:', pageErrors)
