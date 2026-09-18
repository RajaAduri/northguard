import { describe, it, expect } from 'vitest'
import { resolveTouchedAreas } from './resolveTouchedAreas'
import type { LlmFinding, RuleHit } from '../../../../lib/types'

const rule = (area: string): RuleHit => ({ area, ruleId: 'R', offset: 0, length: 3, value: 'abc' })
const llm = (area: string): LlmFinding => ({ area, offset: 5, length: 3, value: 'xyz', layer: 'llm' })

describe('SF-3031 resolveTouchedAreas', () => {
  it('1. rule + llm hits in the same area → one attribution with both layers', () => {
    const out = resolveTouchedAreas([rule('kundendaten')], [llm('kundendaten')])
    expect(out).toHaveLength(1)
    expect(out[0]?.layers.sort()).toEqual(['llm', 'rule'])
  })
  it('2. only rule hits → layers [rule]', () => {
    expect(resolveTouchedAreas([rule('preise-margen')], [])[0]?.layers).toEqual(['rule'])
  })
  it('3. no hits → []', () => {
    expect(resolveTouchedAreas([], [])).toEqual([])
  })
})
