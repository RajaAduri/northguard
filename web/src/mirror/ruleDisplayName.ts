import type { Locale } from '../types'

// SF-5026 — the human rule label shown in the attribution row (Handoff mirror.layer_rule
// "Regel „{name}“"). The verdict carries the rule id (a code constant like RULE-EMAIL); the
// user must never see the constant. These mirror the core RuleFamily labelDe/labelEn; an
// unknown id is humanised rather than shown raw.
const NAMES: Record<string, { de: string; en: string }> = {
  'RULE-CONTRACT': { de: 'Vertragsnummer', en: 'Contract number' },
  'RULE-EMAIL': { de: 'E-Mail-Adresse', en: 'E-mail address' },
  'RULE-IBAN': { de: 'IBAN', en: 'IBAN' },
  'RULE-STEUERNUMMER': { de: 'Steuernummer', en: 'Tax number' },
  'RULE-HRN': { de: 'Handelsregisternummer', en: 'Commercial register number' },
  'RULE-PERCENT-PRICE': { de: 'Prozentangabe im Preiskontext', en: 'Percentage in a price context' },
  'RULE-REPO': { de: 'Repository', en: 'Repository' },
}

export function ruleDisplayName(ruleId: string | undefined, locale: Locale): string {
  if (!ruleId) return ''
  const known = NAMES[ruleId]
  if (known) return locale === 'en' ? known.en : known.de
  return ruleId
    .replace(/^RULE-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
