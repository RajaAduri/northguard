import { describe, it, expect } from 'vitest'
import { assignSemanticPlaceholder } from './assignSemanticPlaceholder'

describe('SF-3042 assignSemanticPlaceholder', () => {
  it('1. type Lieferant, index 0 → ⟨Lieferant⟩ (bare)', () => {
    expect(assignSemanticPlaceholder('Lieferant', 0)).toBe('⟨Lieferant⟩')
  })
  it('2. a colliding second (index 2) → ⟨Lieferant 2⟩', () => {
    expect(assignSemanticPlaceholder('Lieferant', 1)).toBe('⟨Lieferant 1⟩')
    expect(assignSemanticPlaceholder('Lieferant', 2)).toBe('⟨Lieferant 2⟩')
  })
  it('3. an opaque/empty token is forbidden (NG-11)', () => {
    expect(() => assignSemanticPlaceholder('', 0)).toThrow()
    expect(() => assignSemanticPlaceholder('REDACTED', 0)).toThrow()
  })
})
