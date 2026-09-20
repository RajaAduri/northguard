// E5 view types. The E1 contract types live once in core/lib/types.ts (never
// duplicated) — re-exported here so web modules import from one place.
export type {
  Locale,
  Verdict,
  Layer,
  Coverage,
  AreaMode,
  WireMessage,
  RedactionSpan,
  DisplayPlaceholder,
  InspectionVerdict,
  RedactionSpan as Span,
} from '../../core/lib/types'

// ── Composer (AF-501) ─────────────────────────────────────────────────────────
export type ComposerState =
  | 'idle'
  | 'typing'
  | 'inspecting'
  | 'clean'
  | 'touched'
  | 'blocked'
  | 'report'
  | 'report-done'
  | 'degraded'
  | 'locked'

export interface ComposerView {
  state: ComposerState
  statusKey: string
  sendLabelKey: string
  sendTone: 'teal' | 'amber' | 'disabled'
  borderTone: 'muted' | 'amber' | 'red'
  mirrorOpen: boolean
  areaMenuLabelKey: string
}
