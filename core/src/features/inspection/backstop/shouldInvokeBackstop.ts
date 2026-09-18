import type { RuleHit } from '../../../../lib/types'

const SUBSTANTIVE_MIN_CHARS = 15

// SF-3022 — the backstop is the detector for contextual entities (§8 A4), but it
// still only runs when rules were inconclusive: conclusive rule hits mean the turn is
// decided, and a trivial prompt is not worth the latency (NFR-02).
export function shouldInvokeBackstop(prompt: string, ruleHits: RuleHit[]): boolean {
  if (ruleHits.length > 0) return false
  return prompt.trim().length >= SUBSTANTIVE_MIN_CHARS
}
