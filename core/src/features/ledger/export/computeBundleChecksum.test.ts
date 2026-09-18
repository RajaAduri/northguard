import { describe, it, expect } from 'vitest'
import { computeBundleChecksum, formatChecksum } from './computeBundleChecksum'

describe('SF-4054 computeBundleChecksum', () => {
  it('1. a SHA-256 over both artefacts (deterministic)', () => {
    expect(computeBundleChecksum('csv', 'jsonl')).toBe(computeBundleChecksum('csv', 'jsonl'))
    expect(computeBundleChecksum('csv', 'jsonl')).toMatch(/^[0-9a-f]{64}$/)
  })
  it('2. any change → a different checksum', () => {
    expect(computeBundleChecksum('csv', 'jsonl')).not.toBe(computeBundleChecksum('csv2', 'jsonl'))
    expect(computeBundleChecksum('csv', 'jsonl')).not.toBe(computeBundleChecksum('csv', 'jsonl2'))
  })
  it('3. the header prints per the design (SHA-256 xxxx...yyyy)', () => {
    expect(formatChecksum('4f9c000000000000000000000000000000000000000000000000000000000a71e'.slice(0, 64))).toMatch(/^SHA-256 4f9c\.\.\.[0-9a-f]{4}$/)
  })
})
