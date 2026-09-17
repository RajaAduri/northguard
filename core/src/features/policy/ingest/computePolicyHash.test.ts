import { describe, it, expect } from 'vitest'
import { computePolicyHash } from './computePolicyHash'

describe('SF-2014 computePolicyHash', () => {
  it('1. returns a 16-hex sha256 prefix', () => {
    expect(computePolicyHash('Datenrichtlinie der Nordwerk Systemtechnik GmbH')).toMatch(/^[0-9a-f]{16}$/)
  })
  it('2. whitespace-only diff yields the same hash as the trimmed original', () => {
    expect(computePolicyHash('  policy text  ')).toBe(computePolicyHash('policy text'))
  })
  it('3. different content yields a different hash', () => {
    expect(computePolicyHash('a')).not.toBe(computePolicyHash('b'))
  })
})
