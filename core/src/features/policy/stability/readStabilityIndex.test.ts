import { describe, it, expect } from 'vitest'
import { readStabilityIndex } from './readStabilityIndex'
import type { ExtractedGraph } from '../../../../lib/types'

const g = (si: number | null): ExtractedGraph => ({
  key: 'k', areas: [], stabilityIndex: si, stable: null, model: 'm', cached: false,
})

describe('SF-2031 readStabilityIndex', () => {
  it('1. a graph with SI returns it', () => {
    expect(readStabilityIndex(g(0.83))).toBe(0.83)
  })
  it('2. SI null returns null', () => {
    expect(readStabilityIndex(g(null))).toBeNull()
  })
  it('3. SI out of [0,1] throws (sidecar contract violation)', () => {
    expect(() => readStabilityIndex(g(1.4))).toThrow()
    expect(() => readStabilityIndex(g(-0.1))).toThrow()
  })
})
