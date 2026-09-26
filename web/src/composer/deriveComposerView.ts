import type { ComposerState, ComposerView, InspectionVerdict } from '../types'

// SF-5012 — derive the presentation from (state, verdict, degraded). Every field is
// derived, never stored. The degraded overlay surfaces here (areaMenu → rules-only).
export function deriveComposerView(
  state: ComposerState,
  verdict: InspectionVerdict | null,
  degraded = false,
): ComposerView {
  const base = {
    state,
    degraded,
    areaMenuLabelKey: degraded ? 'header.rules_only' : 'header.areas_protected',
  }
  const touchedCount = verdict?.touchedAreas.length ?? 0
  switch (state) {
    case 'locked':
      return { ...base, statusKey: 'composer.locked', sendLabelKey: 'composer.send', sendTone: 'disabled', borderTone: 'muted', mirrorOpen: false }
    case 'inspecting':
      return { ...base, statusKey: 'composer.status_inspecting', sendLabelKey: 'composer.send', sendTone: 'disabled', borderTone: 'muted', mirrorOpen: false }
    case 'clean':
      // NG-2/NG-24: a clean result under degraded coverage must NOT read as a full check —
      // the status line names the reduced basis ("· nur Regeln").
      return { ...base, statusKey: degraded ? 'composer.status_clean_degraded' : 'composer.status_clean', sendLabelKey: 'composer.send', sendTone: 'teal', borderTone: 'muted', mirrorOpen: false }
    case 'touched':
      return {
        ...base,
        statusKey: 'composer.status_touched',
        sendLabelKey: 'composer.send_redacted',
        sendTone: 'amber',
        borderTone: 'amber',
        mirrorOpen: true,
        areaMenuLabelKey: degraded ? 'header.rules_only' : touchedCount === 1 ? 'header.areas_touched_one' : 'header.areas_touched',
      }
    case 'blocked':
      return { ...base, statusKey: 'block.title', sendLabelKey: 'composer.send', sendTone: 'disabled', borderTone: 'red', mirrorOpen: true }
    case 'report':
    case 'report-done':
      return { ...base, statusKey: 'mirror.report', sendLabelKey: 'composer.send', sendTone: 'disabled', borderTone: 'amber', mirrorOpen: true }
    default: // idle / typing
      return { ...base, statusKey: 'composer.status_nothing_sent', sendLabelKey: 'composer.send', sendTone: state === 'typing' ? 'teal' : 'disabled', borderTone: 'muted', mirrorOpen: false }
  }
}
