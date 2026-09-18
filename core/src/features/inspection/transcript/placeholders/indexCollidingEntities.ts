import type { PseudonymSpan } from '../../../../../lib/types'
import { classifyEntityType } from './classifyEntityType'

// SF-3043 — assign each distinct entity (by pseudonym) a 1-based ordinal within its
// type, by first appearance. The same entity (same pseudonym) → one index; distinct
// entities of the same type → 1, 2, …; ordinals are per-type.
export function indexCollidingEntities(spans: PseudonymSpan[]): Map<string, number> {
  const ordinals = new Map<string, number>()
  const nextByType = new Map<string, number>()
  for (const span of spans) {
    if (ordinals.has(span.pseudonym)) continue
    const type = classifyEntityType(span)
    const next = (nextByType.get(type) ?? 0) + 1
    nextByType.set(type, next)
    ordinals.set(span.pseudonym, next)
  }
  return ordinals
}
