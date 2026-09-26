import { describe, it, expect } from 'vitest'
import { buildForwardMessages } from './buildForwardMessages'
import type { WireMessage } from '../types'

describe('SF-5041 buildForwardMessages (P1 — forwarding system prompt)', () => {
  it('omits the placeholder instruction entirely when nothing was masked (step 2)', () => {
    const wire: WireMessage[] = [{ role: 'user', content: 'Fasse die Vorteile von Wärmepumpen zusammen.' }]
    const sys = buildForwardMessages(wire)[0]!
    expect(sys.role).toBe('system')
    expect(sys.content).not.toContain('⟨')
    expect(sys.content).not.toMatch(/Platzhalter/i)
  })

  it('adds a preserve-only instruction when the wire carries placeholders (step 1)', () => {
    const wire: WireMessage[] = [{ role: 'user', content: 'Angebot von ⟨Lieferant 1⟩ prüfen.' }]
    const sys = buildForwardMessages(wire)[0]!
    expect(sys.content).toMatch(/Platzhalter/i)
    expect(sys.content).toMatch(/unverändert/i)
  })

  it('never seeds concrete example tokens the model could generalise from', () => {
    const wire: WireMessage[] = [{ role: 'user', content: 'Marge von ⟨Lieferant 1⟩?' }]
    const content = buildForwardMessages(wire)[0]!.content
    // The old prompt handed the model "⟨Preis⟩" and "⟨Kundenname⟩" as examples — the exact
    // tokens a 4B model then invented on clean prompts. No concrete example tokens allowed.
    expect(content).not.toContain('⟨Preis⟩')
    expect(content).not.toContain('⟨Kundenname⟩')
  })

  it('passes the wire through unchanged after the system message', () => {
    const wire: WireMessage[] = [
      { role: 'user', content: 'Frage ⟨Lieferant 1⟩' },
      { role: 'assistant', content: 'Antwort' },
    ]
    const msgs = buildForwardMessages(wire)
    expect(msgs.slice(1)).toEqual(wire)
  })
})
