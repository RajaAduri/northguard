import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { gatherBriefingInputs } from './gatherBriefingInputs'
import { appendLedgerEntry, setLedgerPath } from '../../ledger/append'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-brief-'))
  setLedgerPath(join(dir, 'ledger.jsonl'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

async function seed(n: number, verdict: 'clean' | 'redact' | 'block', epoch = 1) {
  for (let i = 0; i < n; i++) {
    await appendLedgerEntry({ kind: 'request', ts: '2026-09-10T00:00:00Z', actorPseudonym: `p${i}`, actorEpoch: 1, verdict, touchedAreas: verdict === 'clean' ? [] : ['kundendaten'], spanPseudonyms: verdict === 'clean' ? [] : [{ area: 'kundendaten', layer: 'rule', pseudonym: 'x', keyEpoch: epoch }] })
  }
}
const range = ['2026-09-01T00:00:00Z', '2026-09-30T00:00:00Z'] as const

describe('SF-6021 gatherBriefingInputs', () => {
  it('1. ledger stats + E7 findings gathered', async () => {
    await seed(3, 'redact')
    await seed(1, 'block')
    const inp = await gatherBriefingInputs(range[0], range[1], 'KW 37', 8, [])
    expect(inp.stats.requests).toBe(4)
    expect(inp.stats.redactedForwarded).toBe(3)
    expect(inp.stats.blocked).toBe(1)
    expect(inp.people).toBe(8)
  })
  it('2. too little traffic → insufficient (quiet-week)', async () => {
    await seed(2, 'redact')
    expect((await gatherBriefingInputs(range[0], range[1], 'KW 37', 8)).sufficient).toBe(false)
  })
  it('3. a window spanning a key rotation carries a coverage caveat (R5)', async () => {
    await seed(3, 'redact', 1)
    await seed(3, 'redact', 2)
    expect((await gatherBriefingInputs(range[0], range[1], 'KW 37', 8)).coverageCaveat).toMatch(/Schlüsselwechsel/)
  })
})
