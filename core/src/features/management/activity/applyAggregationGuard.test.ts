import { describe, it, expect } from 'vitest'
import { applyAggregationGuard, AggregationLeakError } from './applyAggregationGuard'
import type { ActivityRow } from '../../../../lib/types'

describe('SF-6032 applyAggregationGuard (NG-13)', () => {
  it('1. clean rows are returned unchanged', () => {
    const rows: ActivityRow[] = [{ date: '2026-09-10', area: 'kundendaten', verdict: 'redact', count: 3 }]
    expect(applyAggregationGuard(rows)).toBe(rows)
  })
  it('2. a row carrying a person dimension throws AggregationLeakError', () => {
    const rows = [{ date: '2026-09-10', area: 'x', verdict: 'redact', count: 1, userId: 'anna' }] as unknown as ActivityRow[]
    expect(() => applyAggregationGuard(rows)).toThrow(AggregationLeakError)
  })
})
