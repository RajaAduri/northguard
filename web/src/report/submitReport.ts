import type { FpReportPayload, ReportForm } from '../types'

// SF-5072 — submit to E6 AF-604 (bridge B8). E5 writes no ledger/state itself; it hands
// a payload to the injected sink. The rest of the prompt (`context`) crosses ONLY when
// the reporter opted in via shareContext (Handoff report.privacy).
export async function submitReport(
  form: ReportForm,
  sink: (payload: FpReportPayload) => Promise<{ faId: string }>,
): Promise<{ faId: string }> {
  const payload: FpReportPayload = {
    faSpan: form.faSpan,
    area: form.area,
    layer: form.layer,
    conversationId: form.conversationId,
  }
  if (form.ruleId !== undefined) payload.ruleId = form.ruleId
  if (form.shareContext && form.context !== undefined) payload.context = form.context
  return sink(payload)
}
