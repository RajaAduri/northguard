import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { exportEvidenceBundle } from './index'
import { appendLedgerEntry, setLedgerPath } from '../append'
import { recomputeChain } from '../verify'
import type { KeyMaterial } from '../../../../lib/types'

const key: KeyMaterial = { secret: 's', keyEpoch: 1 }
let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-bundle-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('AF-405 exportEvidenceBundle (integration)', () => {
  it('produces a checksummed bundle whose JSONL re-verifies as an unbroken chain (AC-1), pseudonyms only', async () => {
    await appendLedgerEntry({ kind: 'request', ts: '2026-09-10T00:00:00Z', actorPseudonym: 'p1', actorEpoch: 1, verdict: 'redact', touchedAreas: ['kundendaten'], mode: 'redact' })
    await appendLedgerEntry({ kind: 'request', ts: '2026-09-11T00:00:00Z', actorPseudonym: 'p2', actorEpoch: 1, verdict: 'clean', touchedAreas: [] })

    const bundle = await exportEvidenceBundle('2026-09-01T00:00:00Z', '2026-09-30T00:00:00Z', 'Kundenaudit Q3', 'lead', key)
    expect(bundle.checksum).toMatch(/^[0-9a-f]{64}$/)
    expect(bundle.header).toMatch(/^SHA-256 /)
    expect(bundle.governanceId).toBeTruthy()

    // AC-1: the exported JSONL chain re-verifies via AF-406.
    const bundlePath = join(dir, 'bundle.jsonl')
    writeFileSync(bundlePath, bundle.jsonl + '\n')
    expect(await recomputeChain(bundlePath)).toEqual({ ok: true })

    // pseudonyms + no raw text / no plaintext user id
    expect(bundle.jsonl).not.toContain('promptText')
    expect(bundle.jsonl).not.toContain('"user"')
    expect(bundle.csv.split('\n')[0]).toBe('ts,area,mode,verdict,caughtBy')
  })
})
