import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { writeGovernanceEvent } from './writeGovernanceEvent'
import { setLedgerPath } from '../append'
import type { KeyMaterial } from '../../../../lib/types'

const key: KeyMaterial = { secret: 's', keyEpoch: 1 }
let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-gov-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-4032 writeGovernanceEvent', () => {
  it('1. a tuning action is appended and an id is returned', async () => {
    const id = await writeGovernanceEvent('rule-narrow', 'lead', 'noise', { before: 41, after: 12 }, key)
    expect(id).toBeTruthy()
    const line = JSON.parse(readFileSync(path, 'utf8').trim())
    expect(line.kind).toBe('governance')
    expect(line.actorPseudonym).toMatch(/^[0-9a-f]{64}$/)
  })

  it('2. a missing actor throws (accountability, NG-12)', async () => {
    await expect(writeGovernanceEvent('dismiss', '', 'reason', {}, key)).rejects.toThrow()
  })

  it('3. governance entries sit in the same chain as other entries', async () => {
    const firstId = await writeGovernanceEvent('activation', 'lead', 'go live', {}, key)
    await writeGovernanceEvent('mode-change', 'lead', 'redact→block', {}, key)
    const [l1, l2] = readFileSync(path, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    expect(l1.id).toBe(firstId)
    expect(l2.prevHash).toBe(l1.hash)
  })
})
