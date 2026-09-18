import { describe, it, expect } from 'vitest'
import { applyManualEdits } from './applyManualEdits'
import type { Area } from '../../../../lib/types'

const areas: Area[] = [
  { id: '1', label: 'Kundendaten', provenance: 'p1', confirmed: false },
  { id: '2', label: 'Lieferanten', provenance: 'p2', confirmed: false },
]

describe('SF-2042 applyManualEdits', () => {
  it('1. a rename changes the label, keeps the id', () => {
    const out = applyManualEdits(areas, [{ kind: 'rename', areaId: '1', label: 'Kunden & Verträge' }])
    expect(out.find((a) => a.id === '1')?.label).toBe('Kunden & Verträge')
    expect(out).toHaveLength(2)
  })
  it('2. a merge of two yields one area with combined provenance', () => {
    const out = applyManualEdits(areas, [{ kind: 'merge', areaId: '1', intoIds: ['2'] }])
    expect(out).toHaveLength(1)
    expect(out[0]?.provenance).toContain('p1')
    expect(out[0]?.provenance).toContain('p2')
  })
  it('3. a split produces two areas from one', () => {
    const out = applyManualEdits(areas, [{ kind: 'split', areaId: '1', splitLabels: ['Kunden', 'Adressen'] }])
    expect(out).toHaveLength(3)
    expect(out.map((a) => a.label)).toEqual(expect.arrayContaining(['Kunden', 'Adressen', 'Lieferanten']))
  })
  it('4. a remove drops the area', () => {
    const out = applyManualEdits(areas, [{ kind: 'remove', areaId: '2' }])
    expect(out.map((a) => a.id)).toEqual(['1'])
  })
})
