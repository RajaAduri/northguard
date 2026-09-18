import { describe, it, expect } from 'vitest'
import { matchRulePatterns } from './matchRulePatterns'

const ids = (t: string) => matchRulePatterns(t).map((h) => h.ruleId)

describe('SF-3012 matchRulePatterns', () => {
  it('1. an email address hits RULE-EMAIL', () => {
    const h = matchRulePatterns('Bitte an anna.berger@nordwerk.de senden')
    expect(h[0]?.ruleId).toBe('RULE-EMAIL')
    expect(h[0]?.value).toBe('anna.berger@nordwerk.de')
    expect(h[0]?.area).toBe('kundendaten')
  })
  it('2. a contract number hits RULE-CONTRACT', () => {
    expect(ids('Vertrag CN-48213 liegt vor')).toContain('RULE-CONTRACT')
  })
  it('3. a percentage in a price sentence hits RULE-PERCENT-PRICE', () => {
    expect(ids('Die Zielmarge von 34 % ist vertraulich')).toContain('RULE-PERCENT-PRICE')
  })
  it('3b. a percentage with NO price term does not hit (narrowed form)', () => {
    expect(ids('Die Testabdeckung von 82 % ist gut')).not.toContain('RULE-PERCENT-PRICE')
  })
  it('4. an internal repository name hits RULE-REPO', () => {
    expect(ids('Siehe Repo shiftnorth-core im Build')).toContain('RULE-REPO')
  })
  it('5. a 100k-char adversarial string completes fast (linear patterns)', () => {
    const big = 'a '.repeat(50_000)
    const t0 = performance.now()
    matchRulePatterns(big)
    expect(performance.now() - t0).toBeLessThan(50)
  })
  it('6. a valid IBAN hits; an invalid check digit does not (MOD-97 validation)', () => {
    expect(ids('Konto DE89 3704 0044 0532 0130 00')).toContain('RULE-IBAN')
    expect(ids('Konto DE88 3704 0044 0532 0130 00')).not.toContain('RULE-IBAN')
  })
  it('7. a Steuernummer hits', () => {
    expect(ids('Steuernummer 21/815/08150 im Register')).toContain('RULE-STEUERNUMMER')
  })
  it('8. a Handelsregisternummer hits in the standard form', () => {
    expect(ids('eingetragen unter HRB 12345 beim AG')).toContain('RULE-HRN')
    expect(ids('HRA 6789 alt')).toContain('RULE-HRN')
  })
})
