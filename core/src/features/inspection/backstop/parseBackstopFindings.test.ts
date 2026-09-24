import { describe, it, expect } from 'vitest'
import { parseBackstopFindings } from './parseBackstopFindings'

describe('SF-3025 parseBackstopFindings (value-based)', () => {
  it('1. fenced JSON is parsed (fences stripped) → {area, value}', () => {
    const raw = '```json\n{"findings":[{"area":"kundendaten","value":"Brechtmann GmbH"}]}\n```'
    const f = parseBackstopFindings(raw)
    expect(f[0]).toEqual({ area: 'kundendaten', value: 'Brechtmann GmbH' })
  })
  it('2. malformed JSON throws (→ treated as inconclusive by the caller)', () => {
    expect(() => parseBackstopFindings('not json at all')).toThrow()
  })
  it('3. entries without a non-empty area+value are dropped; model offsets are ignored', () => {
    const f = parseBackstopFindings('{"findings":[{"area":"kundendaten","value":"Meier AG","offset":99},{"area":"x"},{"value":"y"},{"area":"z","value":""}]}')
    expect(f).toEqual([{ area: 'kundendaten', value: 'Meier AG' }])
  })
})
