import { describe, it, expect } from 'vitest'
import { computePseudonymHmac, normalizeActorId } from './pseudonym'
import type { KeyMaterial } from './types'

const key: KeyMaterial = { secret: 'customer-secret', keyEpoch: 3 }

describe('lib/pseudonym — shared HMAC primitive (NG-10/NG-19)', () => {
  it('same input + key → same pseudonym (stable)', () => {
    expect(computePseudonymHmac('brechtmann', key)).toEqual(computePseudonymHmac('brechtmann', key))
  })

  it('carries the key epoch; a different epoch → a different pseudonym', () => {
    const a = computePseudonymHmac('brechtmann', key)
    const b = computePseudonymHmac('brechtmann', { secret: 'customer-secret', keyEpoch: 4 })
    expect(a.keyEpoch).toBe(3)
    expect(b.keyEpoch).toBe(4)
    expect(a.pseudonym).not.toBe(b.pseudonym)
  })

  it('never contains the original value', () => {
    const { pseudonym } = computePseudonymHmac('anna.berger@nordwerk.de', key)
    expect(pseudonym).not.toContain('anna')
    expect(pseudonym).toMatch(/^[0-9a-f]{64}$/)
  })

  it('normalizeActorId lowercases + trims (an actor resolves across their own requests)', () => {
    expect(normalizeActorId('  Anna.Berger ')).toBe('anna.berger')
    expect(computePseudonymHmac(normalizeActorId('Anna.Berger'), key).pseudonym).toBe(
      computePseudonymHmac(normalizeActorId('anna.berger'), key).pseudonym,
    )
  })
})
