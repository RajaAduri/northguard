import { describe, it, expect } from 'vitest'
import { buildGovernanceEntry } from './buildGovernanceEntry'
import type { KeyMaterial } from '../../../../lib/types'

const key: KeyMaterial = { secret: 'SUPER-SECRET-KEY-XYZ', keyEpoch: 2 }

describe('SF-4031 buildGovernanceEntry', () => {
  it('1. a rule-narrow records the payload (before/after + 30-day impact)', () => {
    const e = buildGovernanceEntry('rule-narrow', 'lead', 'too many false blocks', { before: 41, after: 12 }, key)
    expect(e.kind).toBe('governance')
    expect(e.govKind).toBe('rule-narrow')
    expect(e.payload).toEqual({ before: 41, after: 12 })
  })

  it('2. a dismissal with an empty reason throws (NG-12)', () => {
    expect(() => buildGovernanceEntry('dismiss', 'lead', '', {}, key)).toThrow()
    expect(() => buildGovernanceEntry('dismiss', 'lead', '   ', {}, key)).toThrow()
  })

  it('3. a key-rotate records old/new epoch and carries no key material', () => {
    const e = buildGovernanceEntry('key-rotate', 'lead', 'suspected compromise', { oldEpoch: 2, newEpoch: 3 }, key)
    const json = JSON.stringify(e)
    expect(e.payload).toEqual({ oldEpoch: 2, newEpoch: 3 })
    expect(json).not.toContain(key.secret)
  })

  it('4. the actor is stored as actorPseudonym, never plaintext (NG-19)', () => {
    const e = buildGovernanceEntry('activation', 'anna.berger', 'go live', {}, key)
    expect(e.actorPseudonym).toMatch(/^[0-9a-f]{64}$/)
    expect(e.actorEpoch).toBe(2)
    expect(JSON.stringify(e)).not.toContain('anna.berger')
    expect((e as Record<string, unknown>).user).toBeUndefined()
  })
})
