import type { AttributionRow, RedactionSpan } from '../types'

// SF-5023 — one attribution row per span: placeholder · layer (rule name / KI-Prüfung)
// · area · report action (NG-8).
export function buildAttributionRow(span: RedactionSpan): AttributionRow {
  const row: AttributionRow = {
    placeholder: span.placeholder,
    area: span.area,
    layerLabelKey: span.layer === 'rule' ? 'mirror.layer_rule' : 'mirror.layer_ai',
    reportActionKey: 'mirror.report',
  }
  if (span.ruleId !== undefined) row.ruleId = span.ruleId
  return row
}
