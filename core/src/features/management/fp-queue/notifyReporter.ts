import type { FpOutcome, FpReport, ReporterNotice } from '../../../../lib/types'

// SF-6045 — the reporter hears back, even on a no. The notice targets the originating
// conversation (a quiet line), never a notification centre.
export function notifyReporter(report: FpReport, outcome: FpOutcome): ReporterNotice {
  if (outcome.kind === 'implemented') {
    return {
      faId: report.faId,
      state: 'applied',
      message: `Ihre Meldung ${report.faId} wurde umgesetzt.${outcome.change ? ' ' + outcome.change : ''}`,
    }
  }
  return {
    faId: report.faId,
    state: 'declined',
    message: `Ihre Meldung ${report.faId} bleibt ohne Änderung. Begründung: ${outcome.reason ?? ''}`.trim(),
  }
}
