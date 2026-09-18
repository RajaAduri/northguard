import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeRequestEntry } from './writeRequestEntry'
import { setLedgerPath } from '../append'
import type { InspectionVerdict, KeyMaterial, RequestMeta } from '../../../../lib/types'

const key: KeyMaterial = { secret: 's', keyEpoch: 1 }
const meta = (over: Partial<RequestMeta> = {}): RequestMeta => ({
  userId: 'anna.berger', conversationId: 'c1', redactedText: 'x', promptHash: 'ph', provider: 'eu-endpoint', latencyMs: 40, key, ...over,
})
const verdict = (over: Partial<InspectionVerdict> = {}): InspectionVerdict => ({
  verdict: 'clean', touchedAreas: [], spans: [], redactedPrompt: 'x', displayPlaceholders: [],
  confidence: 1, caughtBy: null, coverage: 'full', ledgerEntryId: '', ...over,
})

let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-req-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-4023 writeRequestEntry', () => {
  it('1. a clean verdict writes exactly one entry, id returned', async () => {
    const id = await writeRequestEntry(verdict(), meta())
    expect(id).toBeTruthy()
    expect(readFileSync(path, 'utf8').trim().split('\n')).toHaveLength(1)
  })
  it('2. a provider failure still writes the entry (FR-14)', async () => {
    const id = await writeRequestEntry(verdict({ caughtBy: null }), meta({ provider: 'eu-endpoint(error)' }))
    const entry = JSON.parse(readFileSync(path, 'utf8').trim())
    expect(entry.id).toBe(id)
    expect(entry.provider).toBe('eu-endpoint(error)')
  })
  it('3. rules-only coverage is recorded on the entry (NG-4)', async () => {
    await writeRequestEntry(verdict({ coverage: 'rules-only' }), meta())
    expect(JSON.parse(readFileSync(path, 'utf8').trim()).coverage).toBe('rules-only')
  })
  it('4. no plaintext user id in the entry (NG-19)', async () => {
    await writeRequestEntry(verdict(), meta())
    expect(readFileSync(path, 'utf8')).not.toContain('anna.berger')
  })
})
