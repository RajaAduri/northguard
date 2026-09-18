import { describe, it, expect } from 'vitest'
import { buildRehydrationIndex } from './buildRehydrationIndex'

describe('SF-3071 buildRehydrationIndex', () => {
  it('1. builds entries keyed by placeholder, with a declension stem', () => {
    const idx = buildRehydrationIndex({ '⟨Lieferant⟩': 'Brechtmann GmbH' })
    expect(idx.entries[0]).toMatchObject({ placeholder: '⟨Lieferant⟩', original: 'Brechtmann GmbH', word: 'Lieferant', stem: 'lieferant' })
  })
  it('2. indexed placeholders resolve distinctly (⟨Lieferant 1⟩ vs ⟨Lieferant 2⟩)', () => {
    const idx = buildRehydrationIndex({ '⟨Lieferant 1⟩': 'ACME', '⟨Lieferant 2⟩': 'BETA' })
    expect(idx.entries.map((e) => e.original)).toEqual(['ACME', 'BETA'])
    expect(idx.entries.map((e) => e.placeholder)).toEqual(['⟨Lieferant 1⟩', '⟨Lieferant 2⟩'])
  })
  it('3. an empty mapping → an empty index', () => {
    expect(buildRehydrationIndex({}).entries).toEqual([])
  })
})
