import { describe, it, expect } from 'vitest'
import { aggregateActivityRows } from './aggregateActivityRows'
import type { LedgerEntry } from '../../../../lib/types'

const req = (ts: string, verdict: string, areas: string[]): LedgerEntry => ({ id: ts + verdict + areas.join(), ts, kind: 'request', prevHash: 'p', hash: 'h', verdict: verdict as LedgerEntry['verdict'], touchedAreas: areas })

describe('SF-6031 aggregateActivityRows', () => {
  it('1. rows by date + area + verdict, counts aggregated', () => {
    const rows = aggregateActivityRows([
      req('2026-09-10T09:00:00Z', 'redact', ['kundendaten']),
      req('2026-09-10T11:00:00Z', 'redact', ['kundendaten']),
      req('2026-09-10T12:00:00Z', 'block', ['zugangsdaten']),
    ])
    expect(rows.find((r) => r.area === 'kundendaten')?.count).toBe(2)
    expect(rows.find((r) => r.area === 'zugangsdaten')?.count).toBe(1)
  })
  it('2. a clean request aggregates under area "--"', () => {
    expect(aggregateActivityRows([req('2026-09-10T09:00:00Z', 'clean', [])])[0]?.area).toBe('--')
  })
  it('3. no entries → empty', () => {
    expect(aggregateActivityRows([])).toEqual([])
  })
})
