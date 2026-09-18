import { describe, it, expect } from 'vitest'
import { computeConfidence } from './computeConfidence'
import type { LlmFinding, RuleHit } from '../../../../lib/types'

describe('SF-3034 computeConfidence', () => {
  it('1. a deterministic rule hit → high confidence', () => {
    const rule: RuleHit[] = [{ area: 'kundendaten', ruleId: 'R', offset: 0, length: 3, value: 'abc' }]
    expect(computeConfidence(rule, [])).toBe(1)
  })
  it('2. llm-only → the model-reported confidence', () => {
    const llm: LlmFinding[] = [{ area: 'kundendaten', offset: 0, length: 3, value: 'abc', layer: 'llm', confidence: 0.72 }]
    expect(computeConfidence([], llm)).toBeCloseTo(0.72)
  })
  it('3. no hits → 1.0 (confident clean)', () => {
    expect(computeConfidence([], [])).toBe(1)
  })
})
