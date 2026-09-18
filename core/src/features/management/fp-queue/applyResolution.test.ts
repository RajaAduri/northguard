import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { applyResolution } from './applyResolution'
import { setLedgerPath } from '../../ledger/append'
import type { KeyMaterial } from '../../../../lib/types'

const key: KeyMaterial = { secret: 's', keyEpoch: 1 }
let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-fp-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-6044 applyResolution', () => {
  it('1. a narrow writes a rule-narrow governance event with before/after in the payload', async () => {
    await applyResolution({ kind: 'narrow', ruleId: 'RULE-PERCENT-PRICE', reason: 'zu viele Fehlalarme', narrowing: { description: '% only with price term', measuredBefore: 41, measuredAfter: 12 } }, 'lead', key)
    const e = JSON.parse(readFileSync(path, 'utf8').trim())
    expect(e.govKind).toBe('rule-narrow')
    expect(e.payload.narrowing.measuredAfter).toBe(12)
    expect(e.actorPseudonym).toMatch(/^[0-9a-f]{64}$/)
  })
  it('2. a dismiss with an empty reason throws (reason mandatory)', async () => {
    await expect(applyResolution({ kind: 'dismiss', faId: 'FA-1', reason: '' }, 'lead', key)).rejects.toThrow()
  })
  it('3. a mode-change writes a mode-change governance event', async () => {
    await applyResolution({ kind: 'mode-change', area: 'preise-margen', mode: 'redact', reason: 'war zu streng' }, 'lead', key)
    expect(JSON.parse(readFileSync(path, 'utf8').trim()).govKind).toBe('mode-change')
  })
})
