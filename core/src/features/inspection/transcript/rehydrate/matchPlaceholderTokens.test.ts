import { describe, it, expect } from 'vitest'
import { matchPlaceholderTokens } from './matchPlaceholderTokens'
import { buildRehydrationIndex } from './buildRehydrationIndex'

describe('SF-3072 matchPlaceholderTokens', () => {
  it('1. an exact ⟨Lieferant⟩ is matched', () => {
    const idx = buildRehydrationIndex({ '⟨Lieferant⟩': 'Brechtmann GmbH' })
    const r = matchPlaceholderTokens('Das Angebot von ⟨Lieferant⟩ ist gut', idx, 'de')
    expect(r.matches).toHaveLength(1)
    expect(r.matches[0]?.original).toBe('Brechtmann GmbH')
  })
  it('2. an inflected "Lieferants" with a confident (unambiguous) stem is matched', () => {
    const idx = buildRehydrationIndex({ '⟨Lieferant⟩': 'Brechtmann GmbH' })
    const r = matchPlaceholderTokens('Das Angebot des Lieferants ist gut', idx, 'de')
    expect(r.matches).toHaveLength(1)
    expect(r.matches[0]?.original).toBe('Brechtmann GmbH')
  })
  it('3. an ambiguous placeholder (two same-stem entries) is NOT matched (NG-9)', () => {
    const idx = buildRehydrationIndex({ '⟨Lieferant 1⟩': 'ACME', '⟨Lieferant 2⟩': 'BETA' })
    const r = matchPlaceholderTokens('Der ⟨Lieferant⟩ meldete sich', idx, 'de')
    expect(r.matches).toHaveLength(0)
  })
  it('3b. a paraphrase (different word) is NOT matched', () => {
    const idx = buildRehydrationIndex({ '⟨Lieferant⟩': 'Brechtmann GmbH' })
    expect(matchPlaceholderTokens('Der Zulieferer meldete sich', idx, 'de').matches).toHaveLength(0)
  })
})
