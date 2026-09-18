import { describe, it, expect } from 'vitest'
import { mapHitsToAreas } from './mapHitsToAreas'
import type { ActivePolicy, RawHit } from '../../../../lib/types'

const policy: ActivePolicy = {
  policyVersion: 'v1',
  areas: [
    { id: 'preise-margen', label: 'Preise & Margen', mode: 'redact', confirmed: true },
    { id: 'kundendaten', label: 'Kundendaten', mode: 'redact', confirmed: true },
  ],
  activatedAt: 't',
  activatedBy: 'lead',
}

describe('SF-3014 mapHitsToAreas', () => {
  it('1. a % hit with area preise-margen active is mapped', () => {
    const hits: RawHit[] = [{ offset: 0, length: 4, value: '34 %', ruleId: 'RULE-PERCENT-PRICE', area: 'preise-margen' }]
    expect(mapHitsToAreas(hits, policy)[0]?.area).toBe('preise-margen')
  })
  it('2. a hit whose area is not in the active policy is dropped', () => {
    const hits: RawHit[] = [{ offset: 0, length: 3, value: 'Repo', area: 'quellcode-repositories' }]
    expect(mapHitsToAreas(hits, policy)).toEqual([])
  })
  it('3. two hits in the same area are both retained (span-level, NG-8)', () => {
    const hits: RawHit[] = [
      { offset: 0, length: 5, value: 'a@b.c', ruleId: 'RULE-EMAIL', area: 'kundendaten' },
      { offset: 10, length: 8, value: 'CN-48213', ruleId: 'RULE-CONTRACT', area: 'kundendaten' },
    ]
    expect(mapHitsToAreas(hits, policy)).toHaveLength(2)
  })
})
