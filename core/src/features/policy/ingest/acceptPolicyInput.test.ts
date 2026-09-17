import { describe, it, expect } from 'vitest'
import { acceptPolicyInput, PolicyTooLargeError } from './acceptPolicyInput'

function pdf(body: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.4\n${body}\n%%EOF`)
}

describe('SF-2011 acceptPolicyInput', () => {
  it('1. kind text with a string returns it unchanged', () => {
    expect(acceptPolicyInput('Datenrichtlinie', 'text')).toEqual({ text: 'Datenrichtlinie' })
  })
  it('2. kind pdf with bytes delegates to extraction', () => {
    expect(acceptPolicyInput(pdf('(Kundendaten) Tj'), 'pdf').text).toContain('Kundendaten')
  })
  it('3. input over the size cap throws PolicyTooLargeError', () => {
    expect(() => acceptPolicyInput('x'.repeat(2_000_001), 'text')).toThrow(PolicyTooLargeError)
  })
})
