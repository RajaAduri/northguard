import { describe, it, expect } from 'vitest'
import { ruleDisplayName } from './ruleDisplayName'

describe('SF-5026 ruleDisplayName (human rule label, never the code constant)', () => {
  it('maps a known rule id to its German / English name', () => {
    expect(ruleDisplayName('RULE-EMAIL', 'de')).toBe('E-Mail-Adresse')
    expect(ruleDisplayName('RULE-EMAIL', 'en')).toBe('E-mail address')
    expect(ruleDisplayName('RULE-PERCENT-PRICE', 'de')).toBe('Prozentangabe im Preiskontext')
  })
  it('never surfaces the RULE- constant for an unknown id — it humanises it', () => {
    const label = ruleDisplayName('RULE-CUSTOM-THING', 'de')
    expect(label).not.toContain('RULE-')
    expect(label).toBe('Custom Thing')
  })
  it('an absent rule id yields an empty label (llm findings have no rule name)', () => {
    expect(ruleDisplayName(undefined, 'de')).toBe('')
  })
})
