import type { ActivePolicy, RawHit, RuleHit } from '../../../../lib/types'

// SF-3014 — map raw hits onto the active policy's areas. A hit whose area is not in
// the active policy is dropped; hits in an active area are kept span-level (NG-8).
export function mapHitsToAreas(hits: RawHit[], policy: ActivePolicy): RuleHit[] {
  const active = new Set(policy.areas.map((a) => a.id))
  const out: RuleHit[] = []
  for (const h of hits) {
    if (h.area === undefined || !active.has(h.area)) continue
    const hit: RuleHit = { area: h.area, offset: h.offset, length: h.length, value: h.value }
    if (h.ruleId !== undefined) hit.ruleId = h.ruleId
    out.push(hit)
  }
  return out
}
