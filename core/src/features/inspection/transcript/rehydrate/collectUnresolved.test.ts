import { describe, it, expect } from 'vitest'
import { collectUnresolved } from './collectUnresolved'
import type { MatchResult } from '../../../../../lib/types'

const empty: MatchResult = { text: '', matches: [] }

describe('SF-3074 collectUnresolved', () => {
  it('1. an unmatched placeholder is listed', () => {
    expect(collectUnresolved('Angebot von ⟨Lieferant⟩ offen', empty)).toEqual(['⟨Lieferant⟩'])
  })
  it('2. all matched → []', () => {
    expect(collectUnresolved('Angebot von Brechtmann GmbH', empty)).toEqual([])
  })
  it('3. an unresolved placeholder remains visible in the restored text (no silent drop)', () => {
    const text = 'A ⟨Vertragsnummer⟩ B'
    expect(collectUnresolved(text, empty)).toContain('⟨Vertragsnummer⟩')
    expect(text).toContain('⟨Vertragsnummer⟩')
  })
})
