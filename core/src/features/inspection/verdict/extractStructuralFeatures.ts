import type { RuleHit } from '../../../../lib/types'

const PRICE_TERM = /(rabatt|marge|margen|zielmarge|preis|preise|aufschlag|deckungsbeitrag|price|pricing|margin|discount|markup)/i

// Amendment B (NG-23) — the structural features that decided the verdict, never the
// text. These make a rule-narrowing measurable (F3) without retaining prompt content.
export function extractStructuralFeatures(prompt: string, ruleHits: RuleHit[]): { name: string; value: boolean }[] {
  const features = [
    { name: 'percentPresent', value: /\d+(?:[.,]\d+)?\s*%/.test(prompt) },
    { name: 'priceTermInSentence', value: PRICE_TERM.test(prompt) },
    { name: 'emailPresent', value: ruleHits.some((h) => h.ruleId === 'RULE-EMAIL') },
    { name: 'contractNumberPresent', value: ruleHits.some((h) => h.ruleId === 'RULE-CONTRACT') },
    { name: 'ibanPresent', value: ruleHits.some((h) => h.ruleId === 'RULE-IBAN') },
  ]
  // per-rule presence flags so a narrowing keyed on a rule is expressible
  for (const id of new Set(ruleHits.map((h) => h.ruleId).filter((x): x is string => !!x))) {
    features.push({ name: `rule:${id}`, value: true })
  }
  return features
}
