import { describe, it, expect } from 'vitest'
import { assertWireIsolation, WireLeakError } from './assertWireIsolation'
import { composeWireMessage } from './composeWireMessage'
import { buildWireText } from '../placeholders'
import { attachPseudonymToSpan } from '../pseudonym'
import type { DetectedSpan, KeyMaterial, WireMessage } from '../../../../../lib/types'

describe('SF-3062 assertWireIsolation', () => {
  it('1. a wire transcript containing an original value throws WireLeakError', () => {
    const wire: WireMessage[] = [{ role: 'user', content: 'Frage zu Brechtmann GmbH' }]
    expect(() => assertWireIsolation(wire, ['Brechtmann GmbH'])).toThrow(WireLeakError)
  })
  it('2. a clean (redacted) wire transcript returns void', () => {
    const wire: WireMessage[] = [{ role: 'user', content: 'Frage zu ⟨Lieferant⟩' }]
    expect(() => assertWireIsolation(wire, ['Brechtmann GmbH'])).not.toThrow()
  })

  // §8 acceptance test — the load-bearing correctness check.
  it('3. a 10-turn conversation with redactions leaks NO original in ANY outbound message', () => {
    const key: KeyMaterial = { secret: 'customer-secret', keyEpoch: 1 }
    const originals: string[] = []
    let wire: WireMessage[] = []

    for (let turn = 0; turn < 10; turn++) {
      const supplier = `Brechtmann${turn} GmbH`
      const email = `kontakt${turn}@nordwerk.de`
      originals.push(supplier, email)
      // "Frage {turn}: <supplier> unter <email>"
      const prompt = `Frage ${turn}: ${supplier} unter ${email}`
      const spans: DetectedSpan[] = [
        { offset: prompt.indexOf(supplier), length: supplier.length, area: 'lieferanten-konditionen', layer: 'llm' },
        { offset: prompt.indexOf(email), length: email.length, area: 'kundendaten', ruleId: 'RULE-EMAIL', layer: 'rule' },
      ]
      const withPseudonyms = attachPseudonymToSpan(spans, prompt, key)
      const { wireText } = buildWireText(prompt, withPseudonyms)
      wire = composeWireMessage(wire, wireText)
      // model reply also stays on the wire in placeholder form
      wire = [...wire, { role: 'assistant', content: `Antwort ${turn} zu ⟨Lieferant⟩ und ⟨E-Mail⟩` }]
    }

    expect(wire.length).toBe(20)
    expect(() => assertWireIsolation(wire, originals)).not.toThrow()
    // and every original is genuinely absent
    for (const msg of wire) for (const o of originals) expect(msg.content).not.toContain(o)
  })
})
