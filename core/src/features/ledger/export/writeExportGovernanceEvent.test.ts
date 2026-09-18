import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeExportGovernanceEvent } from './writeExportGovernanceEvent'
import { setLedgerPath } from '../append'
import type { KeyMaterial } from '../../../../lib/types'

const key: KeyMaterial = { secret: 's', keyEpoch: 1 }
const range = { from: '2026-09-01T00:00:00Z', to: '2026-09-30T00:00:00Z' }
let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-exgov-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-4055 writeExportGovernanceEvent', () => {
  it('1. an export writes a governance entry with actor, reason, range, checksum', async () => {
    await writeExportGovernanceEvent(range, 'Kundenaudit Q3', 'lead', 'abc123', key)
    const e = JSON.parse(readFileSync(path, 'utf8').trim())
    expect(e.govKind).toBe('export')
    expect(e.reason).toBe('Kundenaudit Q3')
    expect(e.payload.checksum).toBe('abc123')
    expect(e.actorPseudonym).toMatch(/^[0-9a-f]{64}$/)
  })
  it('2. a missing reason throws (an export must state its Anlass)', async () => {
    await expect(writeExportGovernanceEvent(range, '  ', 'lead', 'abc', key)).rejects.toThrow()
  })
})
