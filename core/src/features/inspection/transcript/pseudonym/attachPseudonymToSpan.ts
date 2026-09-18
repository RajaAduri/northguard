import type { DetectedSpan, KeyMaterial, PseudonymSpan } from '../../../../../lib/types'
import { classifyEntityType } from '../placeholders/classifyEntityType'
import { normalizeEntityValue } from './normalizeEntityValue'
import { computePseudonymHmac } from './computePseudonymHmac'

// SF-3053 — attach a keyed pseudonym to each span (NG-10). The span's value is read
// from the prompt, normalised (NG-18), and HMAC'd; the original value never appears
// in the output. Same entity → same pseudonym. Block-area spans are pseudonymised too
// (the ledger needs the token). Module owns nothing — the key is injected (NG-14).
export function attachPseudonymToSpan(
  spans: DetectedSpan[],
  prompt: string,
  key: KeyMaterial,
): PseudonymSpan[] {
  return spans.map((span) => {
    const value = prompt.slice(span.offset, span.offset + span.length)
    const type = classifyEntityType(span)
    const normalized = normalizeEntityValue(value, type)
    const { pseudonym, keyEpoch } = computePseudonymHmac(normalized, key)
    return { ...span, pseudonym, keyEpoch }
  })
}
