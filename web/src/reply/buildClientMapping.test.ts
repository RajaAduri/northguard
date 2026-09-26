import { describe, it, expect } from 'vitest'
import { buildClientMapping } from './buildClientMapping'
import type { RedactionSpan } from '../types'

const span = (over: Partial<RedactionSpan>): RedactionSpan => ({
  offset: 0, length: 0, area: 'x', layer: 'rule', placeholder: '⟨X⟩', pseudonym: 'a'.repeat(64), keyEpoch: 1, ...over,
})

describe('SF-5036 buildClientMapping (client-side placeholder→original, NG-14)', () => {
  it('maps each placeholder to the exact original slice at its offset', () => {
    const original = 'Mail an anna.berger@nordwerk.de von Brechtmann GmbH'
    const spans = [
      span({ offset: 8, length: 23, placeholder: '⟨E-Mail-Adresse 1⟩' }),
      span({ offset: 36, length: 15, placeholder: '⟨Lieferant 1⟩' }),
    ]
    expect(buildClientMapping(original, spans)).toEqual({
      '⟨E-Mail-Adresse 1⟩': 'anna.berger@nordwerk.de',
      '⟨Lieferant 1⟩': 'Brechtmann GmbH',
    })
  })

  it('is empty for a clean prompt (no spans)', () => {
    expect(buildClientMapping('nichts erkannt', [])).toEqual({})
  })
})
