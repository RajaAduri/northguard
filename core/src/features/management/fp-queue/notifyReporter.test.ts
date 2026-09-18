import { describe, it, expect } from 'vitest'
import { notifyReporter } from './notifyReporter'
import type { FpReport } from '../../../../lib/types'

const report: FpReport = { faId: 'FA-118', area: 'preise-margen', layer: 'rule', ruleId: 'RULE-PERCENT-PRICE', ts: 't', reporter: 'p1' }

describe('SF-6045 notifyReporter', () => {
  it('1. an implemented report → an "umgesetzt" quiet line', () => {
    const n = notifyReporter(report, { kind: 'implemented', change: 'Regel eingegrenzt' })
    expect(n.state).toBe('applied')
    expect(n.message).toContain('FA-118')
    expect(n.message).toContain('umgesetzt')
  })
  it('2. a dismissal returns the reason to the reporter (a no comes back)', () => {
    const n = notifyReporter(report, { kind: 'dismissed', reason: 'Regel bleibt wie vereinbart' })
    expect(n.state).toBe('declined')
    expect(n.message).toContain('Regel bleibt wie vereinbart')
  })
})
