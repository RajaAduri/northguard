import { describe, it, expect } from 'vitest'
import { indexCollidingEntities } from './indexCollidingEntities'
import type { PseudonymSpan } from '../../../../../lib/types'

const span = (pseudonym: string, area: string, offset: number): PseudonymSpan => ({
  offset, length: 4, area, layer: 'rule', pseudonym, keyEpoch: 1,
})

describe('SF-3043 indexCollidingEntities', () => {
  it('1. two distinct suppliers → indices 1 and 2 by first appearance', () => {
    const m = indexCollidingEntities([span('psA', 'lieferanten-konditionen', 0), span('psB', 'lieferanten-konditionen', 10)])
    expect(m.get('psA')).toBe(1)
    expect(m.get('psB')).toBe(2)
  })
  it('2. the same supplier twice → one index (dedupe by pseudonym)', () => {
    const m = indexCollidingEntities([span('psA', 'lieferanten-konditionen', 0), span('psA', 'lieferanten-konditionen', 20)])
    expect(m.size).toBe(1)
    expect(m.get('psA')).toBe(1)
  })
  it('3. mixed types are indexed within type only', () => {
    const m = indexCollidingEntities([span('psA', 'lieferanten-konditionen', 0), span('psP', 'preise-margen', 10)])
    expect(m.get('psA')).toBe(1)
    expect(m.get('psP')).toBe(1)
  })
})
