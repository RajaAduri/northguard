import { describe, it, expect } from 'vitest'
import { classifyEntityType } from './classifyEntityType'

describe('SF-3041 classifyEntityType', () => {
  it('1. area lieferanten-konditionen → Lieferant', () => {
    expect(classifyEntityType({ area: 'lieferanten-konditionen', layer: 'llm', offset: 0, length: 1 })).toBe('Lieferant')
  })
  it('2. a contract-number rule → Vertragsnummer', () => {
    expect(classifyEntityType({ area: 'kundendaten', ruleId: 'RULE-CONTRACT', layer: 'rule', offset: 0, length: 1 })).toBe('Vertragsnummer')
  })
  it('3. an unknown area falls back to the area label (never [REDACTED])', () => {
    const t = classifyEntityType({ area: 'unbekannter-bereich', layer: 'llm', offset: 0, length: 1 })
    expect(t).toBe('unbekannter-bereich')
    expect(t).not.toBe('[REDACTED]')
  })
})
