import { describe, it, expect } from 'vitest'
import { groupReportsByTrigger } from './groupReportsByTrigger'
import type { FpReport } from '../../../../lib/types'

const rpt = (faId: string, reporter: string, ts: string): FpReport => ({
  faId, area: 'preise-margen', layer: 'rule', ruleId: 'RULE-PERCENT-PRICE', ts, reporter,
})

describe('SF-6041 groupReportsByTrigger', () => {
  it('1. reports on the same trigger form one group', () => {
    const g = groupReportsByTrigger([rpt('FA-1', 'p1', '2026-09-10'), rpt('FA-2', 'p2', '2026-09-11')])
    expect(g).toHaveLength(1)
    expect(g[0]?.ruleId).toBe('RULE-PERCENT-PRICE')
  })
  it('2. the % rule reported by many → one group, count 11, distinct reporters counted', () => {
    const reports = Array.from({ length: 11 }, (_, i) => rpt(`FA-${i}`, `p${i % 4}`, `2026-09-${10 + i}`))
    const g = groupReportsByTrigger(reports)
    expect(g[0]?.count).toBe(11)
    expect(g[0]?.distinctReporters).toBe(4)
  })
  it('3. distinct triggers get their own groups', () => {
    const other: FpReport = { faId: 'FA-x', area: 'kundendaten', layer: 'llm', ts: '2026-09-10', reporter: 'p1' }
    expect(groupReportsByTrigger([rpt('FA-1', 'p1', '2026-09-10'), other])).toHaveLength(2)
  })
})
