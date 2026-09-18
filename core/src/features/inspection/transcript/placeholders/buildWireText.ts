import type { DisplayPlaceholder, PseudonymSpan } from '../../../../../lib/types'
import { classifyEntityType } from './classifyEntityType'
import { assignSemanticPlaceholder } from './assignSemanticPlaceholder'
import { indexCollidingEntities } from './indexCollidingEntities'

// SF-3044 — replace spans with semantic placeholders and return the wire text plus
// the display placeholders (which carry NO original value — the client builds the
// local mapping from these, NG-14). A type with one entity is bare; colliding
// entities are indexed ⟨Type 1⟩/⟨Type 2⟩. Same entity (pseudonym) → same placeholder.
export function buildWireText(
  prompt: string,
  spans: PseudonymSpan[],
): { wireText: string; displayPlaceholders: DisplayPlaceholder[] } {
  const ordinals = indexCollidingEntities(spans)
  // distinct count per type = max ordinal seen for that type
  const distinctByType = new Map<string, number>()
  for (const span of spans) {
    const type = classifyEntityType(span)
    const ord = ordinals.get(span.pseudonym) ?? 1
    distinctByType.set(type, Math.max(distinctByType.get(type) ?? 0, ord))
  }

  const placeholderFor = (span: PseudonymSpan): string => {
    const type = classifyEntityType(span)
    const count = distinctByType.get(type) ?? 1
    const ord = ordinals.get(span.pseudonym) ?? 1
    return count === 1 ? assignSemanticPlaceholder(type, 0) : assignSemanticPlaceholder(type, ord)
  }

  // Replace right-to-left so earlier offsets stay valid.
  let wireText = prompt
  for (const span of [...spans].sort((a, b) => b.offset - a.offset)) {
    const ph = placeholderFor(span)
    wireText = wireText.slice(0, span.offset) + ph + wireText.slice(span.offset + span.length)
  }

  // One display placeholder per distinct entity (deduped by pseudonym); no originals.
  const seen = new Set<string>()
  const displayPlaceholders: DisplayPlaceholder[] = []
  for (const span of spans) {
    if (seen.has(span.pseudonym)) continue
    seen.add(span.pseudonym)
    const type = classifyEntityType(span)
    const count = distinctByType.get(type) ?? 1
    const ord = ordinals.get(span.pseudonym) ?? 1
    displayPlaceholders.push({
      placeholder: placeholderFor(span),
      area: span.area,
      layer: span.layer,
      index: count === 1 ? 0 : ord,
    })
  }
  return { wireText, displayPlaceholders }
}
