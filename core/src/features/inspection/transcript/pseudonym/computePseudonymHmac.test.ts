import { describe, it, expect } from 'vitest'
import { computePseudonymHmac } from './computePseudonymHmac'
import type { KeyMaterial } from '../../../../../lib/types'

const key: KeyMaterial = { secret: 'customer-secret', keyEpoch: 2 }

describe('SF-3052 computePseudonymHmac', () => {
  it('1. same input + key → same pseudonym (stable)', () => {
    expect(computePseudonymHmac('brechtmann', key)).toEqual(computePseudonymHmac('brechtmann', key))
  })
  it('2. a different key epoch → a different pseudonym; keyEpoch reflects it', () => {
    const other = computePseudonymHmac('brechtmann', { secret: 'customer-secret', keyEpoch: 3 })
    expect(other.keyEpoch).toBe(3)
    expect(other.pseudonym).not.toBe(computePseudonymHmac('brechtmann', key).pseudonym)
  })
  it('3. the output never contains the original value', () => {
    const { pseudonym } = computePseudonymHmac('brechtmann', key)
    expect(pseudonym).not.toContain('brechtmann')
  })
})
