import type { InspectionVerdict, LedgerEntry, RequestMeta } from '../../../../lib/types'
import { deriveActorPseudonym } from './deriveActorPseudonym'

// SF-4021 — build the request ledger entry from a verdict + meta. Metadata + span
// pseudonyms only, never original text (NG-2/NG-10); actorPseudonym, never a raw id
// (NG-19). The block-mode verdict is recorded like any other (the ledger is evidence).
export function buildRequestEntry(v: InspectionVerdict, meta: RequestMeta): Partial<LedgerEntry> {
  const { actorPseudonym, actorEpoch } = deriveActorPseudonym(meta.userId, meta.key)
  const touched = v.touchedAreas.map((a) => a.area)
  const mode = v.touchedAreas.length === 0 ? null : (v.verdict === 'block' ? 'block' : 'redact')
  return {
    kind: 'request',
    actorPseudonym,
    actorEpoch,
    conversationId: meta.conversationId,
    redactedText: meta.redactedText,
    ...(meta.features ? { features: meta.features } : {}),
    ...(meta.workTopic !== undefined ? { workTopic: meta.workTopic } : {}),
    ...(meta.baselineVersion !== undefined ? { baselineVersion: meta.baselineVersion } : {}),
    promptHash: meta.promptHash,
    provider: meta.provider,
    latencyMs: meta.latencyMs,
    verdict: v.verdict,
    mode,
    caughtBy: v.caughtBy,
    coverage: v.coverage,
    touchedAreas: touched,
    spanPseudonyms: v.spans.map((s) => ({ area: s.area, layer: s.layer, ...(s.ruleId ? { ruleId: s.ruleId } : {}), pseudonym: s.pseudonym, keyEpoch: s.keyEpoch })),
  }
}
