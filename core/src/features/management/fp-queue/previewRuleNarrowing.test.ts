import { describe, it, expect } from 'vitest'
import { previewRuleNarrowing } from './previewRuleNarrowing'
import type { LedgerEntry } from '../../../../lib/types'

// Entries where RULE-PERCENT-PRICE fired; `priceTermInSentence` distinguishes true
// positives from the % that has no price term (the narrowing target — F3).
function entry(id: string, priceTerm: boolean): LedgerEntry {
  return {
    id, ts: 't', kind: 'request', prevHash: 'p', hash: 'h',
    spanPseudonyms: [{ area: 'preise-margen', layer: 'rule', ruleId: 'RULE-PERCENT-PRICE', pseudonym: 'x', keyEpoch: 1 }],
    features: [{ name: 'percentPresent', value: true }, { name: 'priceTermInSentence', value: priceTerm }, { name: 'rule:RULE-PERCENT-PRICE', value: true }],
  }
}

describe('SF-6043 previewRuleNarrowing (Amendment B F3)', () => {
  const window: LedgerEntry[] = [entry('1', true), entry('2', true), entry('3', false), entry('4', false), entry('5', false)]

  it('a feature-expressible narrowing returns a REAL before/after (measured:true)', () => {
    const p = previewRuleNarrowing('RULE-PERCENT-PRICE', { description: '% only with a price term', requiresFeature: 'priceTermInSentence' }, window)
    expect(p.before).toBe(5)
    expect(p.after).toBe(2) // only the two with a price term still fire
    expect(p.reportsResolved).toBe(3)
    expect(p.measured).toBe(true)
  })

  it('a narrowing whose feature was never captured stays measured:false (never fabricated)', () => {
    const p = previewRuleNarrowing('RULE-PERCENT-PRICE', { description: 'something not captured', requiresFeature: 'sentimentNegative' }, window)
    expect(p.measured).toBe(false)
    expect(p.after).toBe(p.before)
    expect(p.residualRisk).toMatch(/not expressible|re-evaluation/i)
  })

  it('a rule with no hits → 0 before', () => {
    expect(previewRuleNarrowing('RULE-REPO', { description: 'x', requiresFeature: 'priceTermInSentence' }, window).before).toBe(0)
  })
})
