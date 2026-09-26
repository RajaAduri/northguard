// S9 P0 — capture one committed screenshot per §1.1 state + management surface. Boots the
// Vite dev server programmatically, renders states.html, waits for fonts, and writes an
// element-bound PNG per [data-screenshot] to prototype/screenshots/. This is the CI
// deliverable: six images a person reviews instead of clicking six flows.
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(WEB, '..', 'prototype', 'screenshots')

async function main() {
  mkdirSync(OUT, { recursive: true })
  const server = await createServer({ root: WEB, configFile: join(WEB, 'vite.config.ts'), server: { port: 5178 } })
  await server.listen()
  const base = server.resolvedUrls.local[0]
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 })
  try {
    await page.goto(base + 'states.html', { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-screenshot]')
    await page.evaluate(() => document.fonts.ready)
    const keys = await page.$$eval('[data-screenshot]', (els) => els.map((e) => e.getAttribute('data-screenshot')))
    for (const key of keys) {
      const el = page.locator(`[data-screenshot="${key}"]`)
      await el.screenshot({ path: join(OUT, `${key}.png`) })
      console.log(`captured ${key}.png`)
    }
    console.log(`\n${keys.length} screenshots → ${OUT}`)
  } finally {
    await browser.close()
    await server.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
