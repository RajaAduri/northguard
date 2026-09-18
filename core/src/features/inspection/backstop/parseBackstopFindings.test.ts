import { describe, it, expect } from 'vitest'
import { parseBackstopFindings } from './parseBackstopFindings'

describe('SF-3025 parseBackstopFindings', () => {
  it('1. fenced JSON is parsed (fences stripped)', () => {
    const raw = '```json\n{"findings":[{"area":"preise-margen","offset":3,"length":5,"value":"Marge","reason":"r"}]}\n```'
    const f = parseBackstopFindings(raw)
    expect(f[0]?.area).toBe('preise-margen')
    expect(f[0]?.layer).toBe('llm')
  })
  it('2. malformed JSON throws (→ treated as inconclusive by the caller)', () => {
    expect(() => parseBackstopFindings('not json at all')).toThrow()
  })
  it('3. each finding carries layer:llm', () => {
    const f = parseBackstopFindings('{"findings":[{"area":"kundendaten","offset":0,"length":2,"value":"ab"}]}')
    expect(f.every((x) => x.layer === 'llm')).toBe(true)
  })
})
