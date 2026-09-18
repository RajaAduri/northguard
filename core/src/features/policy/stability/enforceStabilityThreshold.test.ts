import { describe, it, expect } from 'vitest'
import { enforceStabilityThreshold } from './enforceStabilityThreshold'

describe('SF-2032 enforceStabilityThreshold (NFR-07)', () => {
  it('1. 0.83 is stable', () => {
    expect(enforceStabilityThreshold(0.83)).toBe(true)
  })
  it('2. 0.79 is not stable', () => {
    expect(enforceStabilityThreshold(0.79)).toBe(false)
  })
  it('3. null is never stable', () => {
    expect(enforceStabilityThreshold(null)).toBe(false)
  })
  it('3b. exactly 0.80 is stable (>= threshold)', () => {
    expect(enforceStabilityThreshold(0.8)).toBe(true)
  })
})
