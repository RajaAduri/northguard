import { describe, it, expect } from 'vitest'
import { normalizePolicyText } from './normalizePolicyText'

describe('SF-2013 normalizePolicyText', () => {
  it('1. CRLF and mixed spaces become LF with collapsed runs', () => {
    expect(normalizePolicyText('a\r\nb\t  c')).toBe('a\nb c')
  })
  it('2. idempotent — the same content twice is byte-identical', () => {
    const once = normalizePolicyText('  Kunden\r\n\r\n\r\n daten   ')
    expect(normalizePolicyText(once)).toBe(once)
  })
  it('3. German umlauts are preserved (NFC)', () => {
    const s = normalizePolicyText('Lieferanten & Preise für Müller')
    expect(s).toContain('Müller')
    expect(s).toContain('für')
  })
})
