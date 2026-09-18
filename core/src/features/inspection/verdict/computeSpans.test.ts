import { describe, it, expect } from 'vitest'
import { computeSpans } from './computeSpans'
import type { LlmFinding, RuleHit } from '../../../../lib/types'

describe('SF-3032 computeSpans', () => {
  it('1. overlapping rule + llm spans merge; the merged span reflects both layers', () => {
    const rule: RuleHit[] = [{ area: 'kundendaten', ruleId: 'R', offset: 10, length: 6, value: 'anna.b' }]
    const llm: LlmFinding[] = [{ area: 'kundendaten', offset: 13, length: 8, value: 'a.berger', layer: 'llm' }]
    const spans = computeSpans(rule, llm)
    expect(spans).toHaveLength(1)
    expect(spans[0]?.layer).toBe('llm') // merged span notes the model layer
    expect(spans[0]?.offset).toBe(10)
    expect(spans[0]?.length).toBe(11) // 10..21
  })
  it('2. each span carries {area, layer, ruleId?} (NG-8)', () => {
    const spans = computeSpans([{ area: 'preise-margen', ruleId: 'RULE-PERCENT-PRICE', offset: 0, length: 4, value: '34 %' }], [])
    expect(spans[0]).toMatchObject({ area: 'preise-margen', layer: 'rule', ruleId: 'RULE-PERCENT-PRICE' })
  })
  it('3. adjacent distinct entities are kept separate (for indexing)', () => {
    const rule: RuleHit[] = [
      { area: 'lieferanten-konditionen', ruleId: 'R', offset: 0, length: 5, value: 'ACME' },
      { area: 'lieferanten-konditionen', ruleId: 'R', offset: 6, length: 5, value: 'BETA' },
    ]
    expect(computeSpans(rule, [])).toHaveLength(2)
  })
})
