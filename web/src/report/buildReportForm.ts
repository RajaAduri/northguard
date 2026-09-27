import type { RedactionSpan, ReportForm } from '../types'

// SF-5071 — the report form, prefilled from the span + conversation. "Share context" is
// OFF by default: otherwise only the marked span + rule + area are shared (report.privacy).
export function buildReportForm(span: RedactionSpan, conversationId: string): ReportForm {
  const form: ReportForm = {
    faSpan: span.placeholder,
    detectedBy: span.layer === 'rule' ? 'mirror.layer_rule' : 'mirror.layer_ai',
    area: span.area,
    layer: span.layer,
    conversationId,
    shareContext: false, // opt-in
  }
  if (span.ruleId !== undefined) form.ruleId = span.ruleId
  return form
}
