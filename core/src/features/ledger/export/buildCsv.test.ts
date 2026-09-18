import { describe, it, expect } from 'vitest'
import { buildCsv, CSV_COLUMNS } from './buildCsv'
import type { LedgerEntry } from '../../../../lib/types'

const base = (o: Partial<LedgerEntry>): LedgerEntry => ({ id: 'i', ts: '2026-09-10T00:00:00Z', kind: 'request', prevHash: 'p', hash: 'h', ...o })

describe('SF-4052 buildCsv', () => {
  it('1. columns are ts, area, mode, verdict, caughtBy', () => {
    expect(buildCsv([]).split('\n')[0]).toBe(CSV_COLUMNS.join(','))
  })
  it('2. a clean request → area "--", mode "unverändert"', () => {
    const csv = buildCsv([base({ verdict: 'clean', touchedAreas: [] })])
    const row = csv.split('\n')[1] ?? ''
    expect(row).toContain('--')
    expect(row).toContain('unverändert')
  })
  it('3. no text columns are present (schema check)', () => {
    const csv = buildCsv([base({ verdict: 'redact', touchedAreas: ['kundendaten'], mode: 'redact', caughtBy: 'rules' })])
    for (const forbidden of ['promptText', 'responseText', 'content']) expect(csv).not.toContain(forbidden)
    expect(csv.split('\n')[1]).toContain('kundendaten')
  })
})
