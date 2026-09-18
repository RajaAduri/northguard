import { describe, it, expect } from 'vitest'
import { deriveActorPseudonym } from './deriveActorPseudonym'
import type { KeyMaterial } from '../../../../lib/types'

const key: KeyMaterial = { secret: 'customer-secret', keyEpoch: 4 }

describe('SF-4024 deriveActorPseudonym (NG-19)', () => {
  it('1. userId → HMAC pseudonym + epoch; the raw id never appears', () => {
    const r = deriveActorPseudonym('anna.berger', key)
    expect(r.actorPseudonym).toMatch(/^[0-9a-f]{64}$/)
    expect(r.actorEpoch).toBe(4)
    expect(r.actorPseudonym).not.toContain('anna')
  })
  it('2. the same user (case/whitespace variants) → the same pseudonym', () => {
    expect(deriveActorPseudonym('Anna.Berger', key).actorPseudonym).toBe(deriveActorPseudonym('  anna.berger ', key).actorPseudonym)
  })
})
