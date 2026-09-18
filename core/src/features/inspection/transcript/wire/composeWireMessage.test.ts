import { describe, it, expect } from 'vitest'
import { composeWireMessage } from './composeWireMessage'
import type { WireMessage } from '../../../../../lib/types'

describe('SF-3061 composeWireMessage', () => {
  it('1. appends this turn as a user wire message to prior redacted history', () => {
    const history: WireMessage[] = [{ role: 'assistant', content: 'Reply about ⟨Lieferant⟩' }]
    const out = composeWireMessage(history, 'Frage zu ⟨Lieferant⟩')
    expect(out).toHaveLength(2)
    expect(out[1]).toEqual({ role: 'user', content: 'Frage zu ⟨Lieferant⟩' })
  })
  it('2. prior turns are carried through unchanged (already redacted, never re-hydrated)', () => {
    const history: WireMessage[] = [{ role: 'user', content: '⟨Vertragsnummer⟩' }]
    expect(composeWireMessage(history, 'x')[0]).toEqual({ role: 'user', content: '⟨Vertragsnummer⟩' })
  })
  it('3. returns a fresh array; history is not mutated', () => {
    const history: WireMessage[] = [{ role: 'user', content: 'a' }]
    const out = composeWireMessage(history, 'b')
    expect(out).not.toBe(history)
    expect(history).toHaveLength(1)
  })
})
