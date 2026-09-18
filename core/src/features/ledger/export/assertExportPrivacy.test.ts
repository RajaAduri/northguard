import { describe, it, expect } from 'vitest'
import { assertExportPrivacy, ExportPrivacyError } from './assertExportPrivacy'

const hex = 'a'.repeat(64)

describe('SF-4056 assertExportPrivacy', () => {
  it('1. a clean bundle (pseudonyms only) returns void', () => {
    const jsonl = JSON.stringify({ id: '1', spanPseudonyms: [{ area: 'lieferanten-konditionen', layer: 'rule', pseudonym: hex, keyEpoch: 1 }] })
    expect(() => assertExportPrivacy('ts,area\n2026,--', jsonl)).not.toThrow()
  })
  it('2. key material or a plaintext user id throws (FR-23/NG-17, NG-19)', () => {
    expect(() => assertExportPrivacy('', JSON.stringify({ secret: 'k' }))).toThrow(ExportPrivacyError)
    expect(() => assertExportPrivacy('', JSON.stringify({ user: 'anna.berger' }))).toThrow(ExportPrivacyError)
  })
  it('3. a span token that is not a pseudonym throws (FR-25)', () => {
    const jsonl = JSON.stringify({ id: '1', spanPseudonyms: [{ area: 'x', layer: 'rule', pseudonym: 'Brechtmann GmbH', keyEpoch: 1 }] })
    expect(() => assertExportPrivacy('', jsonl)).toThrow(ExportPrivacyError)
  })
})
