import { describe, it, expect } from 'vitest'
import { filterByDateArea } from './filterByDateArea'
import type { LedgerEntry } from '../../../../lib/types'

async function* gen(entries: Partial<LedgerEntry>[]): AsyncIterable<LedgerEntry> {
  for (const e of entries) yield e as LedgerEntry
}
const entries: Partial<LedgerEntry>[] = [
  { id: '1', ts: '2026-09-01T00:00:00Z', touchedAreas: ['kundendaten'] },
  { id: '2', ts: '2026-09-10T00:00:00Z', touchedAreas: ['preise-margen'] },
  { id: '3', ts: '2026-09-20T00:00:00Z', touchedAreas: [] },
]

describe('SF-4042 filterByDateArea', () => {
  it('1. a date range returns only entries within', async () => {
    const out = await filterByDateArea(gen(entries), { from: '2026-09-05T00:00:00Z', to: '2026-09-15T00:00:00Z' })
    expect(out.map((e) => e.id)).toEqual(['2'])
  })
  it('2. an area returns only entries touching it', async () => {
    expect((await filterByDateArea(gen(entries), { area: 'kundendaten' })).map((e) => e.id)).toEqual(['1'])
  })
  it('3. no filter returns all', async () => {
    expect((await filterByDateArea(gen(entries), {})).map((e) => e.id)).toEqual(['1', '2', '3'])
  })
})
