import type { DetectedSpan } from '../../../../../lib/types'

// P2 placeholder-name audit (S9): a placeholder name must be an UNAMBIGUOUS noun, because
// the model uses it grammatically wherever it fits. "⟨E-Mail⟩" doubled as "message" vs
// "address" ("ich hoffe, diese ⟨E-Mail⟩ findet Sie gut") → renamed to "E-Mail-Adresse".
// The remaining names each denote exactly one referent: Vertragsnummer, IBAN, Steuernummer,
// Handelsregisternummer, Marge, Repository (BY_RULE) and Lieferant, Preis, Kundenname,
// Projektcodename, Zugangsdaten (BY_AREA). Placeholders follow the tenant language (Handoff
// §11); an EN tenant's analogues (E-mail address, Supplier, Margin, Price …) are likewise
// unambiguous.
const BY_RULE: Record<string, string> = {
  'RULE-CONTRACT': 'Vertragsnummer',
  'RULE-EMAIL': 'E-Mail-Adresse',
  'RULE-IBAN': 'IBAN',
  'RULE-STEUERNUMMER': 'Steuernummer',
  'RULE-HRN': 'Handelsregisternummer',
  'RULE-PERCENT-PRICE': 'Marge',
  'RULE-REPO': 'Repository',
}

const BY_AREA: Record<string, string> = {
  'lieferanten-konditionen': 'Lieferant',
  'preise-margen': 'Preis',
  'kundendaten': 'Kundenname',
  'quellcode-repositories': 'Repository',
  'projektcodenamen': 'Projektcodename',
  'zugangsdaten': 'Zugangsdaten',
}

// SF-3041 — a semantic entity type from the rule (most specific) or the area. Unknown
// falls back to the area label — never an opaque [REDACTED] token (NG-11).
export function classifyEntityType(span: Pick<DetectedSpan, 'area' | 'ruleId'> & Partial<DetectedSpan>): string {
  if (span.ruleId && BY_RULE[span.ruleId]) return BY_RULE[span.ruleId] as string
  return BY_AREA[span.area] ?? span.area
}
