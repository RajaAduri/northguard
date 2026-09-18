import type { DetectedSpan } from '../../../../../lib/types'

const BY_RULE: Record<string, string> = {
  'RULE-CONTRACT': 'Vertragsnummer',
  'RULE-EMAIL': 'E-Mail',
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
