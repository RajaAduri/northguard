import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BlockPanel } from './BlockPanel'
import type { InspectionVerdict } from '../types'

afterEach(cleanup)

function verdict(echo: boolean): InspectionVerdict {
  return {
    verdict: 'block',
    touchedAreas: [{ area: 'Zugangsdaten', mode: 'block', layers: ['llm'], echoBlockedSpans: echo }],
    spans: [{ offset: 0, length: 4, area: 'Zugangsdaten', layer: 'llm', placeholder: '⟨Zugangsdaten⟩', pseudonym: 'a'.repeat(64), keyEpoch: 1 }],
    redactedPrompt: '⟨Zugangsdaten⟩', displayPlaceholders: [], confidence: 1, caughtBy: 'llm', coverage: 'full', ledgerEntryId: 'b',
  }
}

// S10 decision: block-area value echo is per-area. echoBlockedSpans=false (credentials) →
// name the area, never echo the value. echoBlockedSpans=true → echo the user's own value
// (shown only in their browser) so rephrasing is not guesswork.
describe('SF-5025 BlockPanel echo decision', () => {
  it('credential-class (echo false): names the area, never the value', () => {
    render(<BlockPanel verdict={verdict(false)} locale="de" values={{ '⟨Zugangsdaten⟩': 'Sommer2026!' }} />)
    const body = screen.getByTestId('block-panel').textContent ?? ''
    expect(body).toContain('Im Bereich Zugangsdaten')
    expect(body).not.toContain('Sommer2026!')
  })

  it('echo true: shows the detected value (the user’s own text)', () => {
    render(<BlockPanel verdict={verdict(true)} locale="de" values={{ '⟨Zugangsdaten⟩': 'Sommer2026!' }} />)
    const body = screen.getByTestId('block-panel').textContent ?? ''
    expect(body).toContain('Sommer2026!')
    expect(body).toContain('Erkannt wurde')
  })
})
