import { describe, it, expect } from 'vitest'
import { attachPseudonymToSpan } from './attachPseudonymToSpan'
import type { DetectedSpan, KeyMaterial } from '../../../../../lib/types'

const key: KeyMaterial = { secret: 's', keyEpoch: 1 }
// "Brechtmann GmbH und Brechtmann" — same entity twice
const prompt = 'Brechtmann GmbH und Brechtmann'
const spans: DetectedSpan[] = [
  { offset: 0, length: 15, area: 'lieferanten-konditionen', layer: 'rule' },
  { offset: 20, length: 10, area: 'lieferanten-konditionen', layer: 'rule' },
]

describe('SF-3053 attachPseudonymToSpan', () => {
  it('1. each span gets a pseudonym + keyEpoch', () => {
    const out = attachPseudonymToSpan(spans, prompt, key)
    expect(out[0]?.pseudonym).toMatch(/^[0-9a-f]{64}$/)
    expect(out[0]?.keyEpoch).toBe(1)
  })
  it('2. two spans of the same entity → identical pseudonym', () => {
    const out = attachPseudonymToSpan(spans, prompt, key)
    expect(out[0]?.pseudonym).toBe(out[1]?.pseudonym) // "Brechtmann GmbH" ≡ "Brechtmann"
  })
  it('3. a block-area span is still pseudonymised (the ledger needs the token)', () => {
    const block: DetectedSpan[] = [{ offset: 0, length: 8, area: 'zugangsdaten', layer: 'rule' }]
    expect(attachPseudonymToSpan(block, 'passw0rd', key)[0]?.pseudonym).toMatch(/^[0-9a-f]{64}$/)
  })
})
