import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildBaseline } from './buildBaseline'
import { publishBaseline } from './publishBaseline'
import { getActiveBaseline, getBaseline, resetBaselines } from './getActiveBaseline'
import { guardActivation, ActivationBlockedError } from '../activate/guardActivation'
import { setLedgerPath } from '../../ledger/append'
import type { Area, KeyMaterial, StabilityReport } from '../../../../lib/types'

const key: KeyMaterial = { secret: 's', keyEpoch: 1 }
const areas: Area[] = [{ id: 'kundendaten', label: 'Kundendaten', mode: 'redact', confirmed: true }]
let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-base-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
  resetBaselines()
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-2091 buildBaseline (NG-22)', () => {
  it('initial baseline is v1.0, basis initial, changeRequestId null, checksummed', () => {
    const b = buildBaseline(areas, 'lead', null)
    expect(b.version).toBe('v1.0')
    expect(b.basis).toBe('initial')
    expect(b.changeRequestId).toBeNull()
    expect(b.checksum).toMatch(/^[0-9a-f]{32}$/)
  })
  it('a later baseline supersedes the prior version + cites its change request', () => {
    const v1 = buildBaseline(areas, 'lead', null)
    const v2 = buildBaseline(areas, 'lead', 'CR-1', v1)
    expect(v2.version).toBe('v1.1')
    expect(v2.basis).toBe('CR-1')
  })
})

describe('SF-2092/2093 publishBaseline + getActiveBaseline (F4)', () => {
  it('publishing installs the version; a supersede writes a govKind:baseline entry; prior stays readable', async () => {
    const v1 = buildBaseline(areas, 'lead', null)
    await publishBaseline(v1, key)
    expect(getActiveBaseline()?.version).toBe('v1.0')
    const v2 = buildBaseline(areas, 'lead', 'CR-1', v1)
    await publishBaseline(v2, key)
    expect(getActiveBaseline()?.version).toBe('v1.1')
    expect(getBaseline('v1.0')?.version).toBe('v1.0') // prior remains readable (evidence)
    const entries = readFileSync(path, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    expect(entries.filter((e) => e.govKind === 'baseline')).toHaveLength(2)
  })
})

describe('F1 — guardActivation stability gate scope', () => {
  const unstable: StabilityReport = { index: 0.5, threshold: 0.8, stable: false, blockingReason: 'below-threshold' }
  it('initial baseline requires convergence (stability gate applies)', () => {
    expect(() => guardActivation(areas, unstable)).toThrow(ActivationBlockedError)
  })
  it('a change-request baseline carries NO stability check (requireStability=false)', () => {
    expect(() => guardActivation(areas, unstable, false)).not.toThrow()
  })
})
