import { describe, it, expect } from 'vitest'
import { extractPdfText, EmptyPolicyError } from './extractPdfText'

// Minimal synthetic PDFs: text lives in `(...) Tj` operators inside content streams.
function pdf(body: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.4\n${body}\n%%EOF`)
}

describe('SF-2012 extractPdfText', () => {
  it('1. a text PDF returns the concatenated text', () => {
    const bytes = pdf('BT (Datenrichtlinie) Tj (der Nordwerk GmbH) Tj ET')
    const text = extractPdfText(bytes)
    expect(text).toContain('Datenrichtlinie')
    expect(text).toContain('Nordwerk GmbH')
  })
  it('2. an image-only PDF (no text operators) throws EmptyPolicyError', () => {
    expect(() => extractPdfText(pdf('q /Im0 Do Q'))).toThrow(EmptyPolicyError)
  })
  it('3. corrupt bytes (no PDF header) throw EmptyPolicyError', () => {
    expect(() => extractPdfText(new TextEncoder().encode('not a pdf'))).toThrow(EmptyPolicyError)
  })
})
