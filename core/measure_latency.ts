// Integration latency measurement (Sprint 8, step 3). Runs the REAL inspection path
// (assembleVerdict → rules → backstop → decision → pseudonyms → wire → ledger) against
// the running backstop service + local model. Reports the model-path p50/p95 and the
// rules-only path separately. Run: npx vite-node measure_latency.ts
import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { assembleVerdict } from './src/features/inspection/verdict'
import { loadRulesLayer, runRulesLayer } from './src/features/inspection/rules'
import { setLedgerPath } from './src/features/ledger/append'
import type { ActivePolicy, InspectionRequest, KeyMaterial } from './lib/types'

const policy: ActivePolicy = {
  policyVersion: 'v1.0',
  activatedAt: new Date().toISOString(),
  activatedBy: 'integration',
  areas: [
    { id: 'preise-margen', label: 'Preise & Margen', mode: 'redact' },
    { id: 'kundendaten', label: 'Kundendaten', mode: 'redact' },
    { id: 'lieferanten-konditionen', label: 'Lieferanten & Konditionen', mode: 'redact' },
  ],
}
const key: KeyMaterial = { secret: 'integration-secret', keyEpoch: 1 }
const ctx = { key, userId: 'tester@local', provider: 'local-llm (test stand-in)' }

function req(draftPrompt: string, turnIndex = 0): InspectionRequest {
  return { conversationId: 'lat-1', turnIndex, history: [], draftPrompt, locale: 'de', policyVersion: 'v1.0' }
}
function pct(xs: number[], p: number): number {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]!
}
function stats(label: string, xs: number[]) {
  return { path: label, n: xs.length, p50: Math.round(pct(xs, 50)), p95: Math.round(pct(xs, 95)), min: Math.round(Math.min(...xs)), max: Math.round(Math.max(...xs)) }
}

async function main() {
  setLedgerPath(join(mkdtempSync(join(tmpdir(), 'ng-lat-')), 'ledger.jsonl'))
  loadRulesLayer(join(process.cwd(), '..', 'lexicons'))

  // A prompt with NO rule hits → forces the model (contextual) path.
  const modelPrompt = 'Kannst du diesen Absatz kürzer und klarer schreiben, ohne den Sinn zu verändern?'
  // A prompt with a conclusive rule hit (percent + price term) → rules-only, no model.
  const rulesPrompt = 'Unsere Zielmarge liegt bei 34 % und der Rabatt sollte 12 % nicht überschreiten.'

  const modelHits = runRulesLayer({ prompt: modelPrompt, policy, locale: 'de' }).length
  const rulesHits = runRulesLayer({ prompt: rulesPrompt, policy, locale: 'de' }).length
  console.log(`rule hits — modelPrompt: ${modelHits} (want 0), rulesPrompt: ${rulesHits} (want >0)`)

  // Warm the model once (cold load excluded from the figures, noted separately).
  const wt0 = Date.now()
  await assembleVerdict(req(modelPrompt), policy, ctx)
  console.log(`warm-up (cold model load included): ${Date.now() - wt0} ms`)

  const modelMs: number[] = []
  for (let i = 0; i < 8; i++) {
    const t0 = Date.now()
    await assembleVerdict(req(modelPrompt, i), policy, ctx)
    modelMs.push(Date.now() - t0)
    process.stdout.write(`  model call ${i + 1}: ${modelMs[i]} ms\n`)
  }
  const rulesMs: number[] = []
  for (let i = 0; i < 50; i++) {
    const t0 = Date.now()
    await assembleVerdict(req(rulesPrompt, i), policy, ctx)
    rulesMs.push(Date.now() - t0)
  }

  console.log('\nRESULT ' + JSON.stringify({
    model: cfg_model(),
    modelPath: stats('model (backstop invoked)', modelMs),
    rulesPath: stats('rules-only (no model)', rulesMs),
    nfr02BudgetMs: 800,
  }))
}
function cfg_model() { return process.env.LOCAL_LLM_MODEL ?? 'unknown' }
main().catch((e) => { console.error(e); process.exit(1) })
