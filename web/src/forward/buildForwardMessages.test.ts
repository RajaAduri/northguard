import { describe, it, expect } from 'vitest'
import { buildForwardMessages } from './buildForwardMessages'
import type { WireMessage } from '../types'

describe('SF-5041 buildForwardMessages (P1 — forwarding system prompt)', () => {
  it('a clean wire carries no PRESERVE clause (nothing to preserve)', () => {
    const wire: WireMessage[] = [{ role: 'user', content: 'Fasse die Vorteile von Wärmepumpen zusammen.' }]
    const sys = buildForwardMessages(wire)[0]!
    expect(sys.role).toBe('system')
    expect(sys.content).not.toMatch(/unverändert/i) // no "preserve existing placeholders" clause
  })

  it('adds the preserve clause when the wire carries placeholders (step 1)', () => {
    const wire: WireMessage[] = [{ role: 'user', content: 'Angebot von ⟨Lieferant 1⟩ prüfen.' }]
    const sys = buildForwardMessages(wire)[0]!
    expect(sys.content).toMatch(/Platzhalter/i)
    expect(sys.content).toMatch(/unverändert/i)
  })

  it('F5/NG-25: instructs the model to use ⟨…⟩ for its own blanks, never [square brackets]', () => {
    const sys = buildForwardMessages([{ role: 'user', content: 'Schreib eine Antwort-Mail.' }])[0]!.content
    expect(sys).toMatch(/spitzen Klammern/) // use angle brackets
    expect(sys).toMatch(/eckigen Klammern/) // never square brackets
  })

  it('never seeds concrete example tokens the model could generalise from', () => {
    const wire: WireMessage[] = [{ role: 'user', content: 'Marge von ⟨Lieferant 1⟩?' }]
    const content = buildForwardMessages(wire)[0]!.content
    // The old prompt handed the model "⟨Preis⟩" and "⟨Kundenname⟩" as examples — the exact
    // tokens a 4B model then invented on clean prompts. No concrete example tokens allowed.
    expect(content).not.toContain('⟨Preis⟩')
    expect(content).not.toContain('⟨Kundenname⟩')
  })

  it('F3: instructs the model to refuse fabricating a document it was not given', () => {
    const sys = buildForwardMessages([{ role: 'user', content: 'Fasse den beigefügten Vertrag zusammen.' }])[0]!.content
    expect(sys).toMatch(/Inhalt fehlt/i) // says the content is missing
    expect(sys).toMatch(/[Ee]rfinde niemals/) // never invent
    expect(sys).toMatch(/üblicherweise enthält/) // never describe what it would typically contain
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
