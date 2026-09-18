import type { ExtractedGraph } from '../../../../lib/types'

// SF-2031 — read the stability index off the extracted graph. Out of [0,1] is a
// sidecar contract violation and throws (never silently coerced).
export function readStabilityIndex(g: ExtractedGraph): number | null {
  const si = g.stabilityIndex
  if (si === null) return null
  if (si < 0 || si > 1) throw new Error(`stability index out of [0,1]: ${si}`)
  return si
}
