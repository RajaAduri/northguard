// E5 view types. The E1 contract types live once in core/lib/types.ts (never
// duplicated) — re-exported here so web modules import from one place.
import type { Verdict } from '../../core/lib/types'

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
  degraded: boolean
}

// The base lifecycle events. The `degraded` overlay is tracked separately (it applies
// on top of any base state — Handoff "Overlay auf alle"), surfaced by deriveComposerView.
export type ComposerEvent =
  | { type: 'edit' }
  | { type: 'pause' } // typing-pause elapsed (600 ms)
  | { type: 'submit' }
  | { type: 'verdict'; verdict: Verdict }
  | { type: 'report' }
  | { type: 'report-done' }
  | { type: 'areas-confirmed' }
  | { type: 'areas-unconfirmed' }
