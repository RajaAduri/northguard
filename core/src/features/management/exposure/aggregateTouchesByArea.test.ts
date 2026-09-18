import { describe, it, expect } from 'vitest'
import { aggregateTouchesByArea } from './aggregateTouchesByArea'
import type { LedgerEntry } from '../../../../lib/types'

const req = (ts: string, areas: string[]): LedgerEntry => ({ id: ts, ts, kind: 'request', prevHash: 'p', hash: 'h', touchedAreas: areas })

describe('SF-6011 aggregateTouchesByArea', () => {
  it('1. per-area weekly touch counts', () => {
    const m = aggregateTouchesByArea([
      req('2026-09-07T00:00:00Z', ['kundendaten']), // week A
      req('2026-09-08T00:00:00Z', ['kundendaten']), // week A
      req('2026-09-14T00:00:00Z', ['kundendaten']), // week B
    ])
    expect(m.get('kundendaten')).toEqual([2, 1])
  })
  it('2. a clean request (no areas) is counted as no touch', () => {
    const m = aggregateTouchesByArea([req('2026-09-07T00:00:00Z', [])])
    expect(m.size).toBe(0)
  })
  it('3. no userId is read (entries carry none in the management projection)', () => {
    const m = aggregateTouchesByArea([req('2026-09-07T00:00:00Z', ['preise-margen'])])
    expect(m.has('preise-margen')).toBe(true)
  })
})
