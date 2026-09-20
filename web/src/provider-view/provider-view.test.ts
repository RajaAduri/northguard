import { describe, it, expect } from 'vitest'
import { buildWireTranscriptView } from './buildWireTranscriptView'
import { selectFootnote } from './selectFootnote'
import type { WireMessage } from '../types'

const wire: WireMessage[] = [
  { role: 'user', content: 'Frage zu ⟨Lieferant⟩' },
  { role: 'assistant', content: 'Antwort zu ⟨Lieferant⟩' },
]

describe('SF-5041 buildWireTranscriptView', () => {
  it('renders exactly the wire turns; no original value', () => {
    const v = buildWireTranscriptView(wire)
    expect(v.turns).toHaveLength(2)
    expect(v.containsOriginal).toBe(false)
    expect(v.turns.every((t) => t.content.includes('⟨'))).toBe(true)
  })
})

describe('SF-5042 selectFootnote', () => {
  it('own view before/after restore, and the provider view', () => {
    expect(selectFootnote({ view: 'own', hasRestored: false })).toBe('footnote.default')
    expect(selectFootnote({ view: 'own', hasRestored: true })).toBe('footnote.restored')
    expect(selectFootnote({ view: 'provider', hasRestored: true })).toBe('footnote.provider_view')
  })
})
