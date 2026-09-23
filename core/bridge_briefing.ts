// Bridge B4 (TS end) — fetch E7 recurring-work findings from the Python bridge and
// compose the weekly briefing with them. The core stays pure: composeWeeklyBriefing
// takes findings as an argument; this integration runner does the I/O.
// Run: npx vite-node bridge_briefing.ts -- <ledgerPath> [from] [to]
import { setLedgerPath } from './src/features/ledger/append'
import { composeWeeklyBriefing } from './src/features/management/briefing'
import type { RecurringWorkFinding } from './lib/types'

const BRIDGE_URL = process.env.NORTHGUARD_E7_BRIDGE_URL ?? 'http://127.0.0.1:8079/recurring-findings'

async function fetchRecurringFindings(ledgerPath: string, from?: string, to?: string): Promise<{ findings: RecurringWorkFinding[]; modelVersion: string; entriesScanned: number }> {
  const res = await fetch(BRIDGE_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ledgerPath, date_from: from ?? null, date_to: to ?? null }),
  })
  if (!res.ok) throw new Error(`E7 bridge returned ${res.status}`)
  const data = (await res.json()) as { findings: RecurringWorkFinding[]; modelVersion: string; entriesScanned: number }
  return data
}

async function main() {
  const [ledgerPath, from, to] = process.argv.slice(2).filter((a) => a !== '--')
  if (!ledgerPath) throw new Error('usage: vite-node bridge_briefing.ts -- <ledgerPath> [from] [to]')
  setLedgerPath(ledgerPath)

  const { findings, modelVersion, entriesScanned } = await fetchRecurringFindings(ledgerPath, from, to)
  console.log(`B4: fetched ${findings.length} finding(s) from E7 (model ${modelVersion}, ${entriesScanned} entries scanned)`)

  const week = from ? `KW-${from}` : 'KW-test'
  const { inputs, markdown } = await composeWeeklyBriefing(from ?? '2000-01-01', to ?? '2999-12-31', week, 5, findings)
  console.log(`briefing.sufficient=${inputs.sufficient}  findings-in-briefing=${inputs.findings.length}`)
  console.log('----- BRIEFING MARKDOWN -----')
  console.log(markdown)
}
main().catch((e) => { console.error(e); process.exit(1) })
