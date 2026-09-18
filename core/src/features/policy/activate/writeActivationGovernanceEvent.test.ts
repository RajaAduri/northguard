import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeActivationGovernanceEvent } from './writeActivationGovernanceEvent'
import { setLedgerPath } from '../../ledger/append'
import type { ActivePolicy, KeyMaterial } from '../../../../lib/types'

const key: KeyMaterial = { secret: 'k', keyEpoch: 1 }
const policy: ActivePolicy = {
  policyVersion: 'abc123',
  areas: [{ id: '1', label: 'Kundendaten', mode: 'redact', confirmed: true }],
  activatedAt: '2026-09-17T00:00:00Z',
  activatedBy: 'lead',
}

let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-activate-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-2062 writeActivationGovernanceEvent', () => {
  it('1. returns a governance entry id', async () => {
    const id = await writeActivationGovernanceEvent(policy, 'lead', key)
    expect(id).toBeTruthy()
  })
  it('2. records policyVersion + area modes; actor is pseudonymised (NG-19)', async () => {
    await writeActivationGovernanceEvent(policy, 'lead', key)
    const entry = JSON.parse(readFileSync(path, 'utf8').trim())
    expect(entry.govKind).toBe('activation')
    expect(entry.payload.policyVersion).toBe('abc123')
    expect(entry.payload.areaModes).toEqual([{ id: '1', mode: 'redact' }])
    expect(entry.actorPseudonym).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.stringify(entry)).not.toContain('lead')
  })
})
