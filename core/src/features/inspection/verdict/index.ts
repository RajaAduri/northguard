// AF-303 — Verdict assembly (US-008 decision core + SF-3035 full composition,
// completed once AF-304/305/306 (US-009/010/011) and AF-402 (US-014) landed).
import { createHash } from 'node:crypto'
import type {
  ActivePolicy,
  AreaAttribution,
  Coverage,
  InspectionRequest,
  InspectionVerdict,
  KeyMaterial,
  Layer,
  LlmFinding,
  RuleHit,
  VerdictDecision,
} from '../../../../lib/types'
import { resolveTouchedAreas } from './resolveTouchedAreas'
import { computeSpans } from './computeSpans'
import { decideVerdictMode } from './decideVerdictMode'
import { computeConfidence } from './computeConfidence'
import { extractStructuralFeatures } from './extractStructuralFeatures'
import { runRulesLayer } from '../rules'
import { runBackstop } from '../backstop'
import { attachPseudonymToSpan } from '../transcript/pseudonym'
import { buildWireText } from '../transcript/placeholders'
import { composeWireMessage, assertWireIsolation } from '../transcript/wire'
import { writeRequestEntry } from '../../ledger/request'

export { resolveTouchedAreas } from './resolveTouchedAreas'
export { computeSpans } from './computeSpans'
export { decideVerdictMode } from './decideVerdictMode'
export { computeConfidence } from './computeConfidence'
export { extractStructuralFeatures } from './extractStructuralFeatures'

function deriveCaughtBy(areas: AreaAttribution[]): string | null {
  const layers = new Set<Layer>()
  for (const a of areas) for (const l of a.layers) layers.add(l)
  if (layers.size === 0) return null
  if (layers.has('rule') && layers.has('llm')) return 'rules + LLM'
  return layers.has('rule') ? 'rules' : 'LLM backstop'
}

export function assembleDecision(input: {
  ruleHits: RuleHit[]
  llmFindings: LlmFinding[]
  policy: ActivePolicy
  coverage: Coverage
}): VerdictDecision {
  const modeOf = new Map(input.policy.areas.map((a) => [a.id, a.mode ?? 'redact']))
  const touchedAreas = resolveTouchedAreas(input.ruleHits, input.llmFindings).map((a) => ({
    ...a,
    mode: modeOf.get(a.area) ?? 'redact',
  }))
  return {
    verdict: decideVerdictMode(touchedAreas, input.policy),
    touchedAreas,
    spans: computeSpans(input.ruleHits, input.llmFindings),
    confidence: computeConfidence(input.ruleHits, input.llmFindings),
    caughtBy: deriveCaughtBy(touchedAreas),
    coverage: input.coverage,
  }
}

// Context the E1 adapter supplies alongside the request: the customer key + the
// acting user + the provider label. Not part of the E1 InspectionRequest (which
// never carries a key or a raw user id); assembleVerdict takes it explicitly.
export interface InspectionContext {
  key: KeyMaterial
  userId: string
  provider: string
  baselineVersion?: string // the active Schutzprofil baseline in force (Amendment B, NG-23)
}

// SF-3035 — the full inspection turn (the entry point the adapter calls). Orchestrates
// rules → (maybe) backstop → decision → pseudonyms → placeholders → wire →
// ledger write → return. The ledger entry is written BEFORE the verdict returns (NG-5);
// the wire transcript is asserted free of originals (NG-1) before it could be forwarded.
export async function assembleVerdict(
  req: InspectionRequest,
  policy: ActivePolicy,
  ctx: InspectionContext,
): Promise<InspectionVerdict> {
  const t0 = Date.now()
  const ruleHits = runRulesLayer({ prompt: req.draftPrompt, policy, locale: req.locale })
  const backstop = await runBackstop({ prompt: req.draftPrompt, ruleHits, policy })
  const decision = assembleDecision({ ruleHits, llmFindings: backstop.findings, policy, coverage: backstop.coverage })

  const pseudonymSpans = attachPseudonymToSpan(decision.spans, req.draftPrompt, ctx.key)
  const { wireText, displayPlaceholders, spans } = buildWireText(req.draftPrompt, pseudonymSpans)

  // NG-1: prove no original reaches the wire before anything could be forwarded.
  const originals = decision.spans.map((s) => req.draftPrompt.slice(s.offset, s.offset + s.length))
  const wire = composeWireMessage(req.history, wireText)
  assertWireIsolation(wire, originals)

  const verdict: InspectionVerdict = {
    verdict: decision.verdict,
    touchedAreas: decision.touchedAreas,
    spans,
    redactedPrompt: wireText,
    displayPlaceholders,
    confidence: decision.confidence,
    caughtBy: decision.caughtBy,
    coverage: decision.coverage,
    ledgerEntryId: '',
  }

  // NG-5: one ledger entry, written BEFORE the verdict returns (even in degraded mode).
  const promptHash = createHash('sha256').update(req.draftPrompt).digest('hex').slice(0, 32)
  const workTopic = decision.touchedAreas[0]?.area ?? ''
  verdict.ledgerEntryId = await writeRequestEntry(verdict, {
    userId: ctx.userId,
    conversationId: req.conversationId,
    redactedText: verdict.redactedPrompt,
    features: extractStructuralFeatures(req.draftPrompt, ruleHits), // NG-23 business-event record
    workTopic,
    baselineVersion: ctx.baselineVersion ?? 'v1.0',
    promptHash,
    provider: ctx.provider,
    latencyMs: Date.now() - t0,
    key: ctx.key,
  })
  return verdict
}
