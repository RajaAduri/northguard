import { describe, it, expect } from 'vitest'
import { rehydrateReply } from './index'

describe('AF-307 rehydrateReply (integration)', () => {
  it('full: exact + inflected placeholders restored, none unresolved', () => {
    const r = rehydrateReply({
      providerText: 'Das ⟨Lieferant⟩ Angebot und der Lieferants Preis',
      mapping: { '⟨Lieferant⟩': 'Brechtmann GmbH' },
      locale: 'de',
    })
    expect(r.restoredText).not.toContain('⟨Lieferant⟩')
    expect(r.restoredText).toContain('Brechtmann GmbH')
    expect(r.unresolved).toEqual([])
    expect(r.restoredSpans.length).toBeGreaterThanOrEqual(1)
  })

  it('partial: an ambiguous placeholder stays visible and is reported unresolved (NG-9)', () => {
    const r = rehydrateReply({
      providerText: '⟨Lieferant 1⟩ liefert, der ⟨Lieferant⟩ meldet sich',
      mapping: { '⟨Lieferant 1⟩': 'ACME', '⟨Lieferant 2⟩': 'BETA' },
      locale: 'de',
    })
    expect(r.restoredText).toContain('ACME') // the exact indexed one restores
    expect(r.restoredText).toContain('⟨Lieferant⟩') // the ambiguous bare one stays
    expect(r.unresolved).toContain('⟨Lieferant⟩')
  })
})
