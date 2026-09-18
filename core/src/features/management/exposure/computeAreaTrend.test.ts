import { describe, it, expect } from 'vitest'
import { computeAreaTrend } from './computeAreaTrend'

describe('SF-6012 computeAreaTrend', () => {
  it('1. increasing weeks → rising', () => {
    expect(computeAreaTrend([1, 1, 4, 5])).toBe('rising')
  })
  it('2. flat → steady', () => {
    expect(computeAreaTrend([3, 3, 3, 3])).toBe('steady')
  })
  it('3. decreasing → falling', () => {
    expect(computeAreaTrend([5, 4, 1, 0])).toBe('falling')
  })
})
