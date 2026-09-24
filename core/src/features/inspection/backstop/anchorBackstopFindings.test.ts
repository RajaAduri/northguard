import { describe, it, expect } from 'vitest'
import { anchorBackstopFindings } from './anchorBackstopFindings'

const prompt = 'E-Mail an die Brechtmann GmbH; Kopie an Brechtmann GmbH-Zentrale, z. Hd. Klaus Meibert.'

describe('SF-3025b anchorBackstopFindings', () => {
  it('1. locates the exact substring and sets a correct offset/length (layer llm)', () => {
    const [f] = anchorBackstopFindings(prompt, [{ area: 'kundendaten', value: 'Klaus Meibert' }])
    expect(prompt.slice(f!.offset, f!.offset + f!.length)).toBe('Klaus Meibert')
    expect(f!.layer).toBe('llm')
  })
  it('2. emits a span for EVERY occurrence (a repeated name is fully redacted)', () => {
    const fs = anchorBackstopFindings(prompt, [{ area: 'kundendaten', value: 'Brechtmann GmbH' }])
    expect(fs).toHaveLength(2)
    for (const f of fs) expect(prompt.slice(f.offset, f.offset + f.length)).toBe('Brechtmann GmbH')
  })
  it('3. a value that is not a verbatim substring is DROPPED, never guessed (NG-9)', () => {
    expect(anchorBackstopFindings(prompt, [{ area: 'kundendaten', value: 'Brechtmann AG' }])).toEqual([])
  })
})
