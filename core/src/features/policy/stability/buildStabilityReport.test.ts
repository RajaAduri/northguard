import { describe, it, expect } from 'vitest'
import { buildStabilityReport } from './buildStabilityReport'

describe('SF-2033 buildStabilityReport', () => {
  it('1. 0.9 is stable', () => {
    const r = buildStabilityReport(0.9)
    expect(r.stable).toBe(true)
    expect(r.threshold).toBe(0.8)
    expect(r.blockingReason).toBeUndefined()
  })
  it('2. 0.5 is below-threshold', () => {
    expect(buildStabilityReport(0.5)).toMatchObject({ stable: false, blockingReason: 'below-threshold' })
  })
  it('3. null is not-measured', () => {
    expect(buildStabilityReport(null)).toMatchObject({ stable: false, blockingReason: 'not-measured' })
  })
})
