import type { AreaMode, ReportDone } from '../types'

// SF-5073 — the report-done panel: reported id, the rule stays active, a week count, and
// the path forward (rephrase for a block, continue-redacted for a redact). There is no
// per-prompt approval (Handoff rule 7).
export function buildReportDone(faId: string, weekCount: number, mode: AreaMode): ReportDone {
  return {
    faId,
    doneKey: 'report.done',
    ruleStaysKey: 'report.rule_stays',
    pathForwardKey: mode === 'block' ? 'report.rephrase' : 'report.continue_redacted',
    weekCount,
  }
}
