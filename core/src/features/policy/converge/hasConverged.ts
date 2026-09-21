// SF-2072 — the stopping rule: converge when a pass adds nothing above the materiality
// threshold, or at the hard pass ceiling (stop regardless).
export function hasConverged(added: number, materiality: number, passIndex: number, ceiling: number): boolean {
  if (passIndex >= ceiling) return true
  return added <= materiality
}
