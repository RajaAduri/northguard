// SF-2032 — the 0.80 gate (NFR-07). null (not measured) is never treated as stable
// (feeds the activation guard, NG-3).
export function enforceStabilityThreshold(index: number | null, threshold = 0.8): boolean {
  if (index === null) return false
  return index >= threshold
}
