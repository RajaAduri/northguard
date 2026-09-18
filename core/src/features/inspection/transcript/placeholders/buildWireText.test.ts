import { describe, it, expect } from 'vitest'
import { buildWireText } from './buildWireText'
import type { PseudonymSpan } from '../../../../../lib/types'

// "A ACME B BETA C" — two distinct suppliers
const prompt = 'A ACME B BETA C'
const spans: PseudonymSpan[] = [
  { offset: 2, length: 4, area: 'lieferanten-konditionen', layer: 'rule', pseudonym: 'psA', keyEpoch: 1 },
  { offset: 9, length: 4, area: 'lieferanten-konditionen', layer: 'rule', pseudonym: 'psB', keyEpoch: 1 },
]

describe('SF-3044 buildWireText', () => {
  it('1. spans are replaced right-to-left, offsets preserved → indexed placeholders', () => {
    const { wireText } = buildWireText(prompt, spans)
    expect(wireText).toBe('A ⟨Lieferant 1⟩ B ⟨Lieferant 2⟩ C')
  })
  it('1b. a single entity of a type is bare (⟨Lieferant⟩)', () => {
    const one: PseudonymSpan[] = [{ offset: 2, length: 4, area: 'lieferanten-konditionen', layer: 'rule', pseudonym: 'psA', keyEpoch: 1 }]
    expect(buildWireText(prompt, one).wireText).toContain('⟨Lieferant⟩')
  })
  it('2. the output contains no original span text', () => {
    const { wireText } = buildWireText(prompt, spans)
    expect(wireText).not.toContain('ACME')
    expect(wireText).not.toContain('BETA')
  })
  it('3. displayPlaceholders carry {placeholder, area, layer, index} and NO original value (NG-14)', () => {
    const { displayPlaceholders } = buildWireText(prompt, spans)
    expect(displayPlaceholders).toHaveLength(2)
    for (const dp of displayPlaceholders) {
      expect(dp).toHaveProperty('placeholder')
      expect(dp).toHaveProperty('area')
      expect(dp).toHaveProperty('layer')
      expect(dp).toHaveProperty('index')
      expect(JSON.stringify(dp)).not.toContain('ACME')
      expect(JSON.stringify(dp)).not.toContain('BETA')
    }
  })
})
