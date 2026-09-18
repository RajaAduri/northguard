// NorthGuard shared contract types — the single source of truth (never duplicated).
// E1 interception contract (specs/EP-01) + E4 ledger entry (specs/EP-04).

export type Locale = 'de' | 'en'
export type Verdict = 'clean' | 'redact' | 'block'
export type Layer = 'rule' | 'llm'
export type Coverage = 'full' | 'rules-only'
export type AreaMode = 'block' | 'redact'

export interface WireMessage {
  role: 'user' | 'assistant' | 'system'
  content: string // redacted; contains semantic placeholders only
}

export interface RedactionSpan {
  offset: number
  length: number
  area: string
  layer: Layer
  ruleId?: string
  placeholder: string // e.g. "⟨Lieferant 1⟩" (NG-11)
  pseudonym: string // HMAC(customerKey, normalize(value)) (NG-10)
  keyEpoch: number
}

export interface AreaAttribution {
  area: string
  mode: AreaMode
  layers: Layer[]
}

export interface DisplayPlaceholder {
  placeholder: string
  area: string
  layer: Layer
  index: number
}

export interface InspectionRequest {
  conversationId: string
  turnIndex: number
  history: WireMessage[] // prior turns, ALREADY redacted (wire transcript)
  draftPrompt: string // ORIGINAL text (customer-side only)
  locale: Locale
  policyVersion: string
}

export interface InspectionVerdict {
  verdict: Verdict
  touchedAreas: AreaAttribution[]
  spans: RedactionSpan[]
  redactedPrompt: string
  displayPlaceholders: DisplayPlaceholder[]
  confidence: number
  caughtBy: string | null
  coverage: Coverage
  ledgerEntryId: string
}

export interface ProviderChunk {
  delta: string
  done: boolean
}

export interface InterceptionAdapter {
  submitForInspection(req: InspectionRequest): Promise<InspectionVerdict>
  forwardToProvider(
    wire: WireMessage[],
    opts: { stream: boolean },
  ): AsyncIterable<ProviderChunk>
}

// ── Keys ────────────────────────────────────────────────────────────────────
// The customer key lives on customer infrastructure and never leaves (NG-10/NG-17).
export interface KeyMaterial {
  secret: string
  keyEpoch: number
}

// ── E2 policy intake ────────────────────────────────────────────────────────
export interface Area {
  id: string
  label: string
  kind?: string
  provenance?: string
  mode?: AreaMode
  confirmed?: boolean
}

export interface SidecarGraph {
  graph: {
    nodes: { id: string; label: string; kind?: string }[]
    edges: { from: string; to: string; rel?: string }[]
  }
  stability_index: number | null
  stable: boolean | null
  model: string
}

export interface ExtractedGraph {
  key: string
  areas: Area[]
  stabilityIndex: number | null
  stable: boolean | null
  model: string
  cached: boolean
}

export interface StabilityReport {
  index: number | null
  threshold: number
  stable: boolean
  blockingReason?: string
}

export type AreaEditKind = 'rename' | 'merge' | 'split' | 'remove'
export interface AreaEdit {
  kind: AreaEditKind
  areaId: string
  label?: string // rename / split labels
  intoIds?: string[] // merge target(s)
  splitLabels?: string[]
}

export interface ConfirmationModel {
  areas: Area[]
  valid: boolean
  issues: string[]
}

export interface ActivePolicy {
  policyVersion: string
  areas: Area[]
  activatedAt: string
  activatedBy: string
}

// ── E3 inspection / rules ────────────────────────────────────────────────────
export interface LexEntry {
  id: string
  canonical: string
  area: string
  variants: string[]
}
export interface RuleFamily {
  id: string
  area: string
  labelDe: string
  labelEn: string
}
export interface Lexicons {
  entries: LexEntry[]
  ruleFamilies: RuleFamily[]
}

export interface RawHit {
  offset: number
  length: number
  value: string
  ruleId?: string
  area?: string
}

export interface RuleHit {
  area: string
  ruleId?: string
  offset: number
  length: number
  value: string
}

export interface LlmFinding {
  area: string
  offset: number
  length: number
  value: string
  layer: 'llm'
  confidence?: number
}

export interface BackstopResult {
  findings: LlmFinding[]
  coverage: Coverage
}

// The span shape produced by detection/decision (AF-303), before AF-304/305 enrich
// it with a placeholder + pseudonym into a full RedactionSpan.
export interface DetectedSpan {
  offset: number
  length: number
  area: string
  layer: Layer
  ruleId?: string
}

// A detected span once AF-305 has attached its keyed pseudonym; AF-304 indexes
// colliding entities by pseudonym to assign semantic placeholders.
export type PseudonymSpan = DetectedSpan & { pseudonym: string; keyEpoch: number }

// The decision half of AF-303 (verdict + attribution + spans + confidence), before
// the transcript engine (placeholders/pseudonyms/wire) and the ledger write.
export interface VerdictDecision {
  verdict: Verdict
  touchedAreas: AreaAttribution[]
  spans: DetectedSpan[]
  confidence: number
  caughtBy: string | null
  coverage: Coverage
}

export interface BackstopMessages {
  system: string
  user: string
}

// ── E3 rehydration (AF-307) — client-side, mapping injected (NG-9/NG-14) ──────
// The reversible placeholder→original mapping, held client-side only, never persisted.
export type PlaceholderMapping = Record<string, string>

export interface RehydrationEntry {
  placeholder: string // "⟨Lieferant 1⟩"
  original: string // "Brechtmann GmbH"
  word: string // "Lieferant" (inner head word, for declension)
  stem: string // "lieferant"
}
export interface RehydrationIndex {
  entries: RehydrationEntry[]
}

export interface RehydrationMatch {
  placeholder: string
  original: string
  offset: number // in the provider text
  length: number
}
export interface MatchResult {
  matches: RehydrationMatch[]
  text: string
}

export interface RestoredSpan {
  placeholder: string
  original: string
  offset: number // in the restored text
  length: number
}

export interface RehydrateResult {
  restoredText: string
  restoredSpans: RestoredSpan[]
  unresolved: string[]
}

// ── E6 false-positive queue (AF-604) ─────────────────────────────────────────
export interface FpReport {
  faId: string
  area: string
  layer: Layer
  ruleId?: string
  ts: string
  reporter: string // pseudonymous; grouped by trigger, never by reporter (NG-13)
  resolved?: boolean
}
export interface TriggerGroup {
  key: string
  layer: Layer
  area: string
  ruleId?: string
  count: number
  distinctReporters: number
  latestTs: string
  resolved: boolean
}
export type RuleId = string
export interface Narrowing {
  description: string
  measuredBefore?: number // from re-evaluation over originals (measured separately)
  measuredAfter?: number
  reportsResolved?: number
  residualRisk?: string
}
export interface NarrowPreview {
  ruleId: RuleId
  before: number
  after: number
  reportsResolved: number
  residualRisk: string
  measured: boolean // false → the after-count needs an out-of-ledger re-evaluation (flagged)
}
export type FpResolution =
  | { kind: 'narrow'; ruleId: RuleId; reason: string; narrowing: Narrowing }
  | { kind: 'exclude'; ruleId: RuleId; term: string; reason: string }
  | { kind: 'mode-change'; area: string; mode: AreaMode; reason: string }
  | { kind: 'dismiss'; faId: string; reason: string }
export interface FpOutcome {
  kind: 'implemented' | 'dismissed'
  change?: string
  reason?: string
}
export interface ReporterNotice {
  faId: string
  state: 'applied' | 'declined'
  message: string
}

// ── E6 management read-models (all use the management projection — no user, NG-13) ──
export type Trend = 'rising' | 'steady' | 'falling'
export interface AreaExposure {
  area: string
  mode: AreaMode
  touches: number
  trend: Trend
  series: number[]
}
export interface ActivityRow {
  date: string
  area: string
  verdict: string
  count: number
}
export interface ExportRequest {
  from: string
  to: string
  reason: string
}

// ── E4 ledger ─────────────────────────────────────────────────────────────────
export type GovKind =
  | 'activation'
  | 'rule-narrow'
  | 'term-exclude'
  | 'mode-change'
  | 'dismiss'
  | 'export'
  | 'key-rotate'
  | 'unmask'

export type LedgerKind = 'request' | 'governance' | 'ops'

export interface LedgerEntry {
  id: string
  ts: string // ISO
  kind: LedgerKind
  prevHash: string
  hash: string // sha256 over canonical(entry sans hash)
  // request entries:
  actorPseudonym?: string // HMAC(customerKey, normalize(userId)) — NG-19, NEVER a plaintext user id
  actorEpoch?: number
  promptHash?: string
  touchedAreas?: string[]
  verdict?: Verdict
  mode?: AreaMode | null
  caughtBy?: string | null
  provider?: string
  latencyMs?: number
  coverage?: Coverage
  spanPseudonyms?: { area: string; layer: Layer; ruleId?: string; pseudonym: string; keyEpoch: number }[]
  // governance entries:
  govKind?: GovKind
  reason?: string
  payload?: unknown
  // unmask entries (AF-408, NG-20):
  unmaskAuthorisers?: { party: string; role: string }[]
  unmaskTarget?: string
  // NEVER: raw prompt/response text (default mode); NEVER a plaintext user id (NG-19)
}

// ── E4 dual-key unmask (AF-408, NG-20) ───────────────────────────────────────
export interface UnmaskRequest {
  targetPseudonym: string
  reason: string
}
export interface Authorisation {
  party: string
  role: string
}
// The two distinct roles required by the Vier-Augen-Prinzip (bound in E8).
export interface RoleBinding {
  itSecurityRole: string
  worksCouncilRole: string
}
// Supplies the customer's employee directory so a pseudonym can be matched by
// recomputing the HMAC. Physical store is an E8 concern (interface only here).
export interface DirectoryProvider {
  listUserIds(): string[]
}
export interface UnmaskContext {
  key: KeyMaterial
  roleBinding: RoleBinding
  directory: DirectoryProvider
}

// Metadata handed to the request-entry writer (AF-402). Carries the raw userId
// customer-side only; the writer derives actorPseudonym and never stores the raw id.
export interface RequestMeta {
  userId: string
  promptHash: string
  provider: string
  latencyMs: number
  key: KeyMaterial
}
