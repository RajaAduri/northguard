import type { LlmFinding, RuleHit } from '../../../../lib/types'

// SF-3034 — a deterministic rule hit is high-confidence; llm-only uses the model's
// reported confidence; no hits is a confident clean (1.0). Note: clean ≠ "safe" in UI copy.
export function computeConfidence(rule: RuleHit[], llm: LlmFinding[]): number {
  if (rule.length > 0) return 1
  if (llm.length === 0) return 1
  const reported = llm.map((f) => f.confidence).filter((c): c is number => typeof c === 'number')
  if (reported.length === 0) return 0.5 // model gave no number → middling
  return reported.reduce((a, b) => a + b, 0) / reported.length
}
