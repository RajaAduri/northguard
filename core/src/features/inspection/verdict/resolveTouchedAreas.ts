import type { AreaAttribution, Layer, LlmFinding, RuleHit } from '../../../../lib/types'

// SF-3031 — one attribution per touched area, recording which layers caught it.
// `mode` defaults to 'redact' here and is set from the active policy downstream
// (decideVerdictMode / assembleVerdict) — this function is policy-free by contract.
export function resolveTouchedAreas(rule: RuleHit[], llm: LlmFinding[]): AreaAttribution[] {
  const byArea = new Map<string, Set<Layer>>()
  for (const h of rule) {
    const set = byArea.get(h.area) ?? new Set<Layer>()
    set.add('rule')
    byArea.set(h.area, set)
  }
  for (const f of llm) {
    const set = byArea.get(f.area) ?? new Set<Layer>()
    set.add('llm')
    byArea.set(f.area, set)
  }
  return [...byArea.entries()].map(([area, layers]) => ({
    area,
    mode: 'redact',
    layers: [...layers].sort(),
  }))
}
