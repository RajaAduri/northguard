// Drives the running app in a real browser: type a prompt → press Senden → expect an
// inspection result. Captures console messages, page errors, failed requests, and /api
// response statuses, and writes screenshots at each step. Assumes the dev server + gateway
// + backstop are already up. Usage: node scripts/click-inspect.mjs [baseUrl]
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:5173'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'prototype', 'screenshots', 'debug')
const PROMPT = 'Schreib eine kurze Mail an anna.berger@nordwerk.de zur Marge von 34% bei Brechtmann GmbH.'

const console_ = []
const pageErrors = []
const failedReqs = []
const apiResponses = []

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1000, height: 760 } })

  page.on('console', (m) => console_.push(`[${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => pageErrors.push(String(e)))
  page.on('requestfailed', (r) => failedReqs.push(`${r.method()} ${r.url()} — ${r.failure()?.errorText}`))
  page.on('response', (r) => {
    if (r.url().includes('/api/')) apiResponses.push(`${r.status()} ${r.request().method()} ${r.url()}`)
  })

  const steps = []
  const step = async (name, fn) => {
    try { await fn(); steps.push(`OK   ${name}`) } catch (e) { steps.push(`FAIL ${name} — ${e instanceof Error ? e.message : e}`); throw e }
  }

  let failedAt = null
  try {
    await step('load', async () => { await page.goto(BASE, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('[data-testid="composer-input"]', { timeout: 10000 }) })
    await page.screenshot({ path: join(OUT, '01-loaded.png') })

    await step('type prompt', async () => { await page.fill('[data-testid="composer-input"]', PROMPT) })
    await page.screenshot({ path: join(OUT, '02-typed.png') })

    await step('press Senden', async () => { await page.click('[data-testid="send-button"]') })

    await step('expect a VISIBLE inspection result', async () => {
      // Not just a terminal data-state — the result must actually be visible: a touched
      // finding shows the submission mirror, a block shows the block panel, a clean send
      // shows a reply. (A data-state-only check missed the mirror collapsing to 0px.)
      await page.waitForFunction(() => {
        const st = document.querySelector('[data-testid="composer"]')?.getAttribute('data-state')
        const visible = (sel) => { const el = document.querySelector(sel); return !!el && el.getBoundingClientRect().height > 20 }
        if (visible('[data-testid="reply"]')) return true
        if (st === 'clean') return true
        if (st === 'touched') return visible('[data-testid="submission-mirror"]')
        if (st === 'blocked') return visible('[data-testid="block-panel"]')
        return false
      }, { timeout: 45000 })
    })
    await page.screenshot({ path: join(OUT, '03-result.png') })
  } catch {
    failedAt = steps.find((s) => s.startsWith('FAIL')) ?? 'unknown'
    await page.screenshot({ path: join(OUT, '99-failure.png') }).catch(() => {})
  }

  const finalState = await page.evaluate(() => document.querySelector('[data-testid="composer"]')?.getAttribute('data-state') ?? '(no composer)').catch(() => '(eval failed)')

  console.log('\n===== CLICK-INSPECT REPORT =====')
  console.log('base:', BASE)
  for (const s of steps) console.log(' ', s)
  console.log('final composer state:', finalState)
  console.log('\n-- /api responses --'); apiResponses.forEach((r) => console.log('  ', r))
  console.log('\n-- failed requests --'); failedReqs.length ? failedReqs.forEach((r) => console.log('  ', r)) : console.log('   (none)')
  console.log('\n-- page errors --'); pageErrors.length ? pageErrors.forEach((r) => console.log('  ', r)) : console.log('   (none)')
  console.log('\n-- console --'); console_.slice(-25).forEach((r) => console.log('  ', r))
  console.log('\nscreenshots →', OUT)
  console.log('RESULT:', failedAt ? `FAILED at ${failedAt}` : 'PASSED')

  await browser.close()
  process.exit(failedAt ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(2) })
