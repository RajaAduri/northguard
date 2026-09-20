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
  RehydrateResult,
  RestoredSpan,
  PlaceholderMapping,
} from '../../core/lib/types'

// ── Reply rehydration view (AF-503) ───────────────────────────────────────────
export type ReplyMode = 'full' | 'partial' | 'not-rendered'
export interface ReplyView {
  mode: ReplyMode
  footerKey: string
  openCount: number
  restoredCount: number
}
export interface CopyModel {
  lineKey: string
  warningKey: string | null // set when the clipboard would hold real customer data
  redactedKey: string
  restoredCount: number
}
export interface RestoreSuggestion {
  placeholder: string
  suggestion: string | null
  applyKey: string
  keepKey: string
}

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

// ── Submission mirror (AF-502) ────────────────────────────────────────────────
export interface AttributionRow {
  placeholder: string
  area: string
  layerLabelKey: string // 'mirror.layer_rule' | 'mirror.layer_ai'
  ruleId?: string
  reportActionKey: string // 'mirror.report'
}
export interface MirrorModel {
  headerKey: string
  summary: { count: number; areas: string[] }
  wireText: string // byte-identical to InspectionVerdict.redactedPrompt (FR-08)
  rows: AttributionRow[]
}
export interface BlockModel {
  headerKey: string
  areas: string[]
  detected: { value: string; layerLabelKey: string; ruleId?: string }[]
  ledgerNoteKey: string
  noApprovalKey: string // there is no per-prompt approval (Handoff rule 7)
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
