import { describe, it, expect } from 'vitest'
import { previewRuleNarrowing } from './previewRuleNarrowing'
import type { LedgerEntry } from '../../../../lib/types'

const hit = (rule: string): LedgerEntry => ({ id: rule + Math.random(), ts: 't', kind: 'request', prevHash: 'p', hash: 'h', spanPseudonyms: [{ area: 'preise-margen', layer: 'rule', ruleId: rule, pseudonym: 'x', keyEpoch: 1 }] })
const window: LedgerEntry[] = [hit('RULE-PERCENT-PRICE'), hit('RULE-PERCENT-PRICE'), hit('RULE-EMAIL')]

describe('SF-6043 previewRuleNarrowing', () => {
  it('1. a measured narrowing reports before → after + reports resolved', () => {
    const p = previewRuleNarrowing('RULE-PERCENT-PRICE', { description: '% only with a price term', measuredBefore: 41, measuredAfter: 12, reportsResolved: 4, residualRisk: '% without price term no longer blocked' }, window)
    expect(p.before).toBe(41)
    expect(p.after).toBe(12)
    expect(p.reportsResolved).toBe(4)
    expect(p.measured).toBe(true)
  })
  it('2. without a measured after-count, before is counted from the ledger and the preview is flagged (not fabricated)', () => {
    const p = previewRuleNarrowing('RULE-PERCENT-PRICE', { description: 'x' }, window)
    expect(p.before).toBe(2) // two ledger hits of the rule
    expect(p.after).toBe(2) // placeholder — flagged
    expect(p.measured).toBe(false)
    expect(p.residualRisk).toMatch(/re-evaluation/i)
  })
  it('3. a rule with no ledger hits → 0 impact', () => {
    expect(previewRuleNarrowing('RULE-REPO', { description: 'x' }, window).before).toBe(0)
  })
})
