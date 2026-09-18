import type { ActivePolicy, AreaAttribution, Verdict } from '../../../../lib/types'

// SF-3033 — a touch in ANY block-mode area ⇒ block (no redacted variant); touches
// only in redact areas ⇒ redact; no touches ⇒ clean. Mode comes from the policy.
export function decideVerdictMode(areas: AreaAttribution[], policy: ActivePolicy): Verdict {
  if (areas.length === 0) return 'clean'
  const modeOf = new Map(policy.areas.map((a) => [a.id, a.mode ?? 'redact']))
  const anyBlock = areas.some((a) => modeOf.get(a.area) === 'block')
  return anyBlock ? 'block' : 'redact'
}
