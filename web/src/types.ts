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

// ── False-positive report flow (AF-507) ──────────────────────────────────────
export interface ReportForm {
  faSpan: string // the marked placeholder/span
  detectedBy: string // layer label key
  area: string
  ruleId?: string
  conversationId: string
  shareContext: boolean // OFF by default (opt-in); the rest of the prompt only crosses if true
  context?: string
}
// What crosses bridge B8 to E6 AF-604. Without opt-in, only span+rule+area (no context).
export interface FpReportPayload {
  faSpan: string
  area: string
  ruleId?: string
  conversationId: string
  context?: string
}
export interface ReportDone {
  faId: string
  doneKey: string
  ruleStaysKey: string
  pathForwardKey: string // report.rephrase (block) | report.continue_redacted (redact)
  weekCount: number
}
export interface ReporterNoticeView {
  state: 'pending' | 'applied' | 'declined'
  messageKey: string
}

// ── Two-rooms threshold + management shell (AF-508) ───────────────────────────
export interface ThresholdView {
  kickerKey: string
  headlineKey: string
  bodyKey: string // states structural, no-names aggregation (NG-13)
  enterKey: string
  week: string
  people: number
}
export type MgmtTab = 'briefing' | 'density' | 'false-positives' | 'ledger' | 'evidence'
export interface MgmtShell {
  activeTab: MgmtTab
  navKeys: string[]
  maxWidthPx: 720
  typeface: string
  hasPersonColumn: false // structural (NG-13)
}
export interface BriefingRow {
  observation: string // names a pseudonymised cluster + area, never a person/original (C1, NG-21)
  scope: string
  artefact: string
}
export interface BriefingView {
  week: string
  people: number
  rows: BriefingRow[]
  estimate: { low: number; high: number; approx: true; noteKey: string }
  hasPersonColumn: false
}

// ── Provider-view toggle (AF-504) ─────────────────────────────────────────────
export interface WireView {
  turns: { role: 'user' | 'assistant' | 'system'; content: string }[]
  footerKey: string
  containsOriginal: false // the wire is the only thing that leaves the building (NG-1)
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
