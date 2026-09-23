// Seed a test tenant by running REAL onboarding on a published German policy
// (test-corpus). Convergence (AF-207) → clarifying questions (AF-208) → baseline v1.0
// (AF-209). Writes .tenant/policy.json so the gateway serves the real profile.
// Run: npx vite-node onboard_tenant.ts -- <policy.txt> <tenantDir>
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { convergeExtraction } from './src/features/policy/converge'
import { detectAmbiguities, generateClarifyingQuestions } from './src/features/policy/questions'
import { buildBaseline, publishBaseline, resetBaselines } from './src/features/policy/baseline'
import { setLedgerPath } from './src/features/ledger/append'
import type { Area, KeyMaterial } from './lib/types'

// The enforceable protected-area catalogue the detection layer (E3 rules/lexicon)
// actually supports. Extraction slugs (E2 graph nodes) live in a different namespace,
// so — pending the mapGraphToAreas→canonical reconciliation flagged in SESSION-SUMMARY —
// the ENFORCEABLE baseline is the canonical catalogue; the extracted concepts are kept
// as provenance (evidence the profile is grounded in the real policy). Modes per
// Handoff rule 17: block only where a placeholder helps the model nothing (Zugangsdaten).
function canonicalAreas(lexiconDir: string): Area[] {
  const doc = parse(readFileSync(join(lexiconDir, 'protected-areas-de.yml'), 'utf8')) as { entries: { area: string; canonical: string }[] }
  return doc.entries.map((e) => ({ id: e.area, label: e.canonical, mode: e.area === 'zugangsdaten' ? 'block' : 'redact', confirmed: true }))
}

async function main() {
  const [policyPath, tenantDir] = process.argv.slice(2).filter((a) => a !== '--')
  if (!policyPath || !tenantDir) throw new Error('usage: vite-node onboard_tenant.ts -- <policy.txt> <tenantDir>')
  const policy = readFileSync(policyPath, 'utf8')
  setLedgerPath(join(tenantDir, 'ledger.jsonl'))
  resetBaselines()

  console.log(`onboarding on ${policyPath} (${policy.length} chars)`)
  const t0 = Date.now()
  const { working, report } = await convergeExtraction(policy)
  console.log(`convergence: ${report.passes} passes, last added ${report.lastAdded}, converged=${report.converged} (${Date.now() - t0} ms incl. cache)`)
  console.log(`areas extracted: ${working.areas.length}`)
  console.log('sample areas:', working.areas.slice(0, 12).map((a) => a.label).join(' · '))

  const questions = generateClarifyingQuestions(detectAmbiguities(working))
  console.log(`clarifying questions: ${questions.length}`)
  for (const q of questions) console.log(`  - [${q.areaRef}] ${q.text}`)

  const enforceable = canonicalAreas(join(process.cwd(), '..', 'lexicons'))
  const key: KeyMaterial = { secret: process.env.NG_TENANT_SECRET ?? 'tenant-demo-secret', keyEpoch: 1 }
  const baseline = buildBaseline(enforceable, 'quality-lead', null)
  await publishBaseline(baseline, key)
  console.log(`baseline published: ${baseline.version} · basis ${baseline.basis} · checksum ${baseline.checksum} · ${baseline.areas.length} enforceable areas`)
  console.log('enforceable areas:', baseline.areas.map((a) => `${a.id}(${a.mode})`).join(' · '))

  // What the gateway reads as the active protection profile. Enforceable = canonical
  // catalogue; extractedConcepts = the real graph from the policy (provenance/evidence).
  writeFileSync(join(tenantDir, 'policy.json'), JSON.stringify({
    version: baseline.version, createdAt: baseline.createdAt, approver: baseline.approver,
    checksum: baseline.checksum, convergence: report, clarifyingQuestions: questions.length,
    areas: baseline.areas.map((a) => ({ id: a.id, label: a.label, mode: a.mode ?? 'redact' })),
    extractedConcepts: working.areas.map((a) => a.label),
  }, null, 2), 'utf8')
  console.log(`wrote ${join(tenantDir, 'policy.json')} (enforceable catalogue + ${working.areas.length} extracted concepts as provenance)`)
}
main().catch((e) => { console.error(e); process.exit(1) })
