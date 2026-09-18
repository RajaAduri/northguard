// AF-203 — Stability gate (NFR-07, NG-3). The core re-enforces 0.80 even if the
// sidecar said stable=true.
import type { ExtractedGraph, StabilityReport } from '../../../../lib/types'
import { readStabilityIndex } from './readStabilityIndex'
import { buildStabilityReport } from './buildStabilityReport'

export { readStabilityIndex } from './readStabilityIndex'
export { enforceStabilityThreshold } from './enforceStabilityThreshold'
export { buildStabilityReport } from './buildStabilityReport'

export function evaluateStability(g: ExtractedGraph): StabilityReport {
  return buildStabilityReport(readStabilityIndex(g))
}
