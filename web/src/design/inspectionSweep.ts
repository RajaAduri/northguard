import { motion } from './motionTokens'

// SF-5064 — the 2px teal inspection sweep. Period = the inspection duration, but never
// below the legibility minimum (400ms). transparent→teal→transparent is the only
// gradient in the product (§4).
export interface SweepParams {
  heightPx: 2
  periodMs: number
  widthPct: 40
  gradient: 'transparent→teal→transparent'
}

export function inspectionSweepParams(inspectionMs: number): SweepParams {
  return {
    heightPx: 2,
    periodMs: Math.max(inspectionMs, motion.inspectionSweepMin.ms),
    widthPct: 40,
    gradient: 'transparent→teal→transparent',
  }
}
