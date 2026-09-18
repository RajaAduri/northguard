import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { invokeExport } from './invokeExport'
import { appendLedgerEntry, setLedgerPath } from '../../ledger/append'
import type { KeyMaterial } from '../../../../lib/types'

const key: KeyMaterial = { secret: 's', keyEpoch: 1 }
let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-exview-'))
  setLedgerPath(join(dir, 'ledger.jsonl'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-6052 invokeExport', () => {
  it('1. a valid request produces a checksummed bundle (delegates AF-405)', async () => {
    await appendLedgerEntry({ kind: 'request', ts: '2026-09-10T00:00:00Z', actorPseudonym: 'p1', actorEpoch: 1, verdict: 'redact', touchedAreas: ['kundendaten'], mode: 'redact' })
    const bundle = await invokeExport({ from: '2026-09-01T00:00:00Z', to: '2026-09-30T00:00:00Z', reason: 'Audit' }, 'lead', key)
    expect(bundle.checksum).toMatch(/^[0-9a-f]{64}$/)
    expect(bundle.jsonl).toContain('actorPseudonym') // audit token present
    expect(bundle.jsonl).not.toContain('"user"') // never a plaintext id (NG-19)
  })
  it('2. an invalid request (no reason) throws', async () => {
    await expect(invokeExport({ from: '2026-09-01T00:00:00Z', to: '2026-09-30T00:00:00Z', reason: '' }, 'lead', key)).rejects.toThrow()
  })
})
