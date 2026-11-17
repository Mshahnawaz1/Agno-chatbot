/** Starts the replay harness (vite) and a headless Chromium. Shared by examples.mjs and audit.mjs. */
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'

/** PW_CHROMIUM, else Playwright's own browser, else any chromium in ~/.cache/ms-playwright. */
function chromePath() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM
  if (existsSync(chromium.executablePath())) return undefined
  const root = homedir() + '/.cache/ms-playwright/'
  const dirs = existsSync(root) ? readdirSync(root).filter((d) => d.startsWith('chromium-')).sort().reverse() : []
  for (const d of dirs) {
    const p = root + d + '/chrome-linux64/chrome'
    if (existsSync(p)) return p
  }
  return undefined
}

export async function open() {
  const server = await createServer({
    configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
    server: { port: 5199, strictPort: false },
  })
  await server.listen()
  const url = server.resolvedUrls.local[0]
  const browser = await chromium.launch({ executablePath: chromePath() })
  const page = await browser.newPage()
  const consoleErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))
  await page.goto(url)
  await page.waitForFunction(() => document.title === 'ready' && window.__replay, null, { timeout: 60000 })
  return {
    page,
    consoleErrors,
    close: async () => {
      await browser.close()
      await server.close()
    },
  }
}
