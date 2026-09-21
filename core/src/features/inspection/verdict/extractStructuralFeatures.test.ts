import { describe, it, expect } from 'vitest'
import { extractStructuralFeatures } from './extractStructuralFeatures'
import type { RuleHit } from '../../../../lib/types'

const hit = (ruleId: string): RuleHit => ({ area: 'preise-margen', ruleId, offset: 0, length: 4, value: '34 %' })
const feat = (fs: { name: string; value: boolean }[], n: string) => fs.find((f) => f.name === n)?.value

describe('US-014a extractStructuralFeatures (NG-23 business-event record)', () => {
  it('records percentPresent + priceTermInSentence structurally (never the text)', () => {
    const fs = extractStructuralFeatures('Die Zielmarge von 34 % ist vertraulich', [hit('RULE-PERCENT-PRICE')])
    expect(feat(fs, 'percentPresent')).toBe(true)
    expect(feat(fs, 'priceTermInSentence')).toBe(true)
    // no original text is carried — features are names + booleans only
    expect(JSON.stringify(fs)).not.toContain('vertraulich')
  })
  it('a percentage without a price term → percentPresent true, priceTermInSentence false', () => {
    const fs = extractStructuralFeatures('Die Testabdeckung von 82 % ist gut', [])
    expect(feat(fs, 'percentPresent')).toBe(true)
    expect(feat(fs, 'priceTermInSentence')).toBe(false)
  })
  it('per-rule presence flags are emitted for narrowing expressibility (F3)', () => {
    const fs = extractStructuralFeatures('a@b.de', [hit('RULE-EMAIL')])
    expect(feat(fs, 'emailPresent')).toBe(true)
    expect(feat(fs, 'rule:RULE-EMAIL')).toBe(true)
  })
})
