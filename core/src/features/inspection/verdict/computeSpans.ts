import type { DetectedSpan, LlmFinding, RuleHit } from '../../../../lib/types'

// SF-3032 — the span set the transcript engine will redact. Overlapping rule+llm
// spans merge (the model layer wins on the merged span); adjacent distinct entities
// stay separate so they can be indexed (⟨Lieferant 1⟩/⟨2⟩). Span-level attribution (NG-8).
// Emits DetectedSpan; AF-304/305 add placeholder + pseudonym → RedactionSpan.
export function computeSpans(rule: RuleHit[], llm: LlmFinding[]): DetectedSpan[] {
  const initial: DetectedSpan[] = [
    ...rule.map((h): DetectedSpan => ({ offset: h.offset, length: h.length, area: h.area, layer: 'rule', ...(h.ruleId ? { ruleId: h.ruleId } : {}) })),
    ...llm.map((f): DetectedSpan => ({ offset: f.offset, length: f.length, area: f.area, layer: 'llm' })),
  ].sort((a, b) => a.offset - b.offset)

  const merged: DetectedSpan[] = []
  for (const span of initial) {
    const prev = merged[merged.length - 1]
    if (prev && prev.area === span.area && span.offset < prev.offset + prev.length) {
      const end = Math.max(prev.offset + prev.length, span.offset + span.length)
      prev.length = end - prev.offset
      if (span.layer === 'llm') prev.layer = 'llm' // merged span reflects the model layer
      if (span.ruleId && !prev.ruleId) prev.ruleId = span.ruleId
    } else {
      merged.push({ ...span })
    }
  }
  return merged
}
