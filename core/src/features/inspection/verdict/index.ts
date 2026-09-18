// AF-303 — Verdict assembly (US-008), decision core. The full assembleVerdict
// (SF-3035: + placeholders/pseudonyms/wire + the NG-5 ledger write) is completed in
// US-011, once AF-304/305/306 exist. This file delivers the deterministic decision.
import type {
  ActivePolicy,
  AreaAttribution,
  Coverage,
  Layer,
  LlmFinding,
  RuleHit,
  VerdictDecision,
} from '../../../../lib/types'
import { resolveTouchedAreas } from './resolveTouchedAreas'
import { computeSpans } from './computeSpans'
import { decideVerdictMode } from './decideVerdictMode'
import { computeConfidence } from './computeConfidence'

export { resolveTouchedAreas } from './resolveTouchedAreas'
export { computeSpans } from './computeSpans'
export { decideVerdictMode } from './decideVerdictMode'
export { computeConfidence } from './computeConfidence'

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
