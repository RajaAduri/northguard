import { describe, it, expect } from 'vitest'
import { matchLexiconTerms } from './matchLexiconTerms'
import type { Lexicons } from '../../../../lib/types'

const lex: Lexicons = {
  entries: [
    { id: 'L1', canonical: 'Lieferanten & Konditionen', area: 'lieferanten-konditionen', variants: ['Lieferant', 'supplier', 'Lieferbedingungen'] },
    { id: 'L2', canonical: 'Preise & Margen', area: 'preise-margen', variants: ['Preis', 'Preisstufe'] },
  ],
  ruleFamilies: [],
}

describe('SF-3013 matchLexiconTerms', () => {
  it('1. longest match wins for an overlapping compound', () => {
    const hits = matchLexiconTerms('Die Preisstufe ist geheim', lex, 'de')
    expect(hits[0]?.value).toBe('Preisstufe')
    expect(hits[0]?.area).toBe('preise-margen')
  })
  it('2. the EN synonym also matches (bilingual)', () => {
    expect(matchLexiconTerms('our supplier list', lex, 'en')[0]?.area).toBe('lieferanten-konditionen')
  })
  it('3. distinct non-overlapping terms are both retained', () => {
    const hits = matchLexiconTerms('Lieferant und Preis', lex, 'de')
    expect(hits.map((h) => h.value).sort()).toEqual(['Lieferant', 'Preis'])
  })
})
