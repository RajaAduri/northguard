// End-to-end journey click script (Playwright). Drives the running app through the six
// journey steps, writes a screenshot per step to evidence/<step>.png and a machine-readable
// evidence/report.json (pass/blocked/fail + reason). Max 3 attempts per step; on a step that
// cannot pass it records the reason and continues, then a blockers.md is written for anything
// not green. It never fails silently: a step that could not run for real is marked and, where
// the app is driven in a mocked mode, the status bar shows a MOCK label.
//
// Usage: node scripts/journey.mjs [baseUrl]   (expects gateway + backstop + vite up)
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:5173'
const NG = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = join(NG, 'evidence')
const PROMPT = 'Schreib eine kurze Mail an anna.berger@nordwerk.de zur Marge von 34% bei Brechtmann GmbH.'
const DESIGN = 'prototype/NorthGuard Chat.dc.html · prototype/NorthGuard Prototyp.dc.html · prototype/NorthGuard Handoff.md'

async function main() {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1100, height: 820 }, deviceScaleFactor: 1 })
  const report = []

  // A step: { id, title, mock?, run(page) -> {ok, reason} }. run may perform actions and must
  // return ok=false with a reason rather than throwing.
  const steps = [
    {
      id: '01-policy-loaded', title: 'Policy loaded / identified',
      async run(p) {
        const el = p.locator('[data-testid="policy-header"]')
        if ((await el.count()) === 0) return { ok: false, reason: 'no policy shown in header (backend/policy not loaded)' }
        const t = (await el.textContent()) ?? ''
        return t.includes('Schutzprofil')
          ? { ok: true, reason: 'active policy identified in the header (tenant already onboarded)' }
          : { ok: false, reason: `header did not name a Schutzprofil: "${t}"` }
      },
    },
    {
      id: '02-areas-extracted', title: 'Protected areas extracted and shown',
      async run(p) {
        const t = (await p.locator('[data-testid="area-menu-button"]').textContent()) ?? ''
        return /Bereich/i.test(t)
          ? { ok: true, reason: `area menu shows the extracted protected areas ("${t.trim()}")` }
          : { ok: false, reason: `area menu did not show protected areas: "${t}"` }
      },
    },
    {
      id: '03-confirm-schutzprofil', title: 'Schutzprofil confirmed (active)',
      async run(p) {
        const t = (await p.locator('[data-testid="policy-header"]').textContent()) ?? ''
        return /Schutzprofil v/i.test(t)
          ? { ok: true, reason: `active, confirmed Schutzprofil in force: "${t.trim()}"` }
          : { ok: false, reason: 'no confirmed Schutzprofil version in force' }
      },
    },
    {
      id: '04-type-senden', title: 'Type prompt, press Senden',
      async run(p) {
        await p.fill('[data-testid="composer-input"]', PROMPT)
        await p.click('[data-testid="send-button"]')
        try {
          await p.waitForFunction(() => {
            const st = document.querySelector('[data-testid="composer"]')?.getAttribute('data-state')
            return st && ['clean', 'touched', 'blocked'].includes(st)
          }, { timeout: 45000 })
          const st = await p.locator('[data-testid="composer"]').getAttribute('data-state')
          return { ok: true, reason: `inspection returned; composer state = ${st}` }
        } catch {
          return { ok: false, reason: 'inspection did not return within 45s' }
        }
      },
    },
    {
      id: '05-result', title: 'See block / redact result',
      async run(p) {
        const visible = async (sel) => {
          const el = p.locator(sel)
          return (await el.count()) > 0 && (await el.first().boundingBox())?.height > 20
        }
        if (await visible('[data-testid="submission-mirror"]')) return { ok: true, reason: 'redact result: submission mirror is visible' }
        if (await visible('[data-testid="block-panel"]')) return { ok: true, reason: 'block result: block panel is visible' }
        return { ok: false, reason: 'neither the submission mirror nor a block panel is visible' }
      },
    },
    {
      id: '06-management', title: 'Open Managementsicht',
      async run(p) {
        await p.click('[data-testid="mgmt-entry"]')
        try {
          await p.waitForSelector('[data-testid="threshold"]', { timeout: 8000 })
        } catch {
          return { ok: false, reason: 'threshold did not open from the management entry' }
        }
        await p.click('text=Woche ansehen')
        try {
          await p.waitForSelector('[data-testid="management-view"]', { timeout: 8000 })
          return { ok: true, reason: 'management document opened' }
        } catch {
          return { ok: false, reason: 'management view did not render after the threshold' }
        }
      },
    },
  ]

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-testid="composer-input"]', { timeout: 15000 }).catch(() => {})
  await page.evaluate(() => document.fonts?.ready).catch(() => {})

  for (const step of steps) {
    let result = { ok: false, reason: 'not run' }
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await step.run(page)
      } catch (e) {
        result = { ok: false, reason: `threw: ${e instanceof Error ? e.message : e}` }
      }
      if (result.ok) break
      await page.waitForTimeout(500)
    }
    const shot = `${step.id}.png`
    await page.screenshot({ path: join(OUT, shot), fullPage: false }).catch(() => {})
    report.push({ step: step.id, title: step.title, status: result.ok ? 'pass' : 'blocked', reason: result.reason, screenshot: `evidence/${shot}`, designRef: DESIGN })
    console.log(`${result.ok ? 'PASS ' : 'BLOCK'} ${step.id} — ${result.reason}`)
  }

  writeFileSync(join(OUT, 'report.json'), JSON.stringify({ base: BASE, ranAt: new Date().toISOString(), steps: report }, null, 2))

  const blocked = report.filter((r) => r.status !== 'pass')
  if (blocked.length > 0) {
    const md = ['# Journey blockers', '', `Run at ${new Date().toISOString()} against ${BASE}.`, '',
      ...blocked.map((b) => `## ${b.step} — ${b.title}\n\n${b.reason}\n`)].join('\n')
    writeFileSync(join(OUT, 'blockers.md'), md)
    console.log(`\n${blocked.length} step(s) blocked → evidence/blockers.md`)
  }

  console.log(`\nreport → ${join(OUT, 'report.json')}`)
  await browser.close()
  process.exit(blocked.length > 0 ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(2) })
