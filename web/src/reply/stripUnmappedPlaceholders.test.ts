import { describe, it, expect } from 'vitest'
import { stripUnmappedPlaceholders } from './stripUnmappedPlaceholders'

describe('SF-5035 stripUnmappedPlaceholders (P1 — display only)', () => {
  it('removes ⟨…⟩ tokens the model invented (no mapping) and tidies whitespace', () => {
    const mapping = {}
    expect(stripUnmappedPlaceholders('Der ⟨Preis⟩ ist wichtig.', mapping)).toBe('Der ist wichtig.')
    expect(stripUnmappedPlaceholders('Sehr geehrte/r ⟨Kundenname⟩,', mapping)).toBe('Sehr geehrte/r,')
  })

  it('keeps placeholders that DO have a mapping (rehydration will restore them — NG-9)', () => {
    const mapping = { '⟨Lieferant 1⟩': 'Brechtmann GmbH' }
    expect(stripUnmappedPlaceholders('Angebot von ⟨Lieferant 1⟩ prüfen.', mapping)).toBe('Angebot von ⟨Lieferant 1⟩ prüfen.')
  })

  it('strips only the unmapped ones in a mixed reply', () => {
    const mapping = { '⟨Lieferant 1⟩': 'Brechtmann GmbH' }
    expect(stripUnmappedPlaceholders('⟨Lieferant 1⟩ bietet ⟨Marge⟩ an.', mapping)).toBe('⟨Lieferant 1⟩ bietet an.')
  })

  it('leaves clean replies untouched', () => {
    expect(stripUnmappedPlaceholders('Wärmepumpen sparen Energie.', {})).toBe('Wärmepumpen sparen Energie.')
  })
})
