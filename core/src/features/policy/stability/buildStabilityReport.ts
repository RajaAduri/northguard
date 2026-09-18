import type { StabilityReport } from '../../../../lib/types'
import { enforceStabilityThreshold } from './enforceStabilityThreshold'

const THRESHOLD = 0.8

// SF-2033 — the report the activation guard consumes. null → not-measured (never
// treated as stable); below the gate → below-threshold.
export function buildStabilityReport(index: number | null): StabilityReport {
  const stable = enforceStabilityThreshold(index, THRESHOLD)
  if (stable) return { index, threshold: THRESHOLD, stable: true }
  return {
    index,
    threshold: THRESHOLD,
    stable: false,
    blockingReason: index === null ? 'not-measured' : 'below-threshold',
  }
}
