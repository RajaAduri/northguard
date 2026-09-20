import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { SubmissionMirror } from './SubmissionMirror'
import type { InspectionVerdict } from '../types'

afterEach(cleanup)

const verdict: InspectionVerdict = {
  verdict: 'redact',
  touchedAreas: [{ area: 'lieferanten-konditionen', mode: 'redact', layers: ['rule'] }],
  spans: [{ offset: 9, length: 12, area: 'lieferanten-konditionen', layer: 'rule', ruleId: 'RULE-CONTRACT', placeholder: '⟨Vertragsnummer⟩', pseudonym: 'a'.repeat(64), keyEpoch: 1 }],
  redactedPrompt: 'Frage zu ⟨Vertragsnummer⟩ heute',
  displayPlaceholders: [], confidence: 1, caughtBy: 'rules', coverage: 'full', ledgerEntryId: 'e1',
}

describe('SF-5024 SubmissionMirror (render smoke, jsdom)', () => {
  it('renders the wire text verbatim (read-only mirror of redactedPrompt)', () => {
    render(<SubmissionMirror verdict={verdict} locale="de" />)
    expect(screen.getByTestId('wire-text').textContent).toBe('Frage zu ⟨Vertragsnummer⟩ heute')
    expect(screen.getByTestId('submission-mirror').getAttribute('aria-readonly')).toBe('true')
  })
})
