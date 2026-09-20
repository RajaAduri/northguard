import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Composer } from './Composer'
import type { InspectionVerdict } from '../types'

afterEach(cleanup)

const touched: InspectionVerdict = {
  verdict: 'redact',
  touchedAreas: [{ area: 'kundendaten', mode: 'redact', layers: ['rule'] }],
  spans: [], redactedPrompt: 'x', displayPlaceholders: [], confidence: 1, caughtBy: 'rules', coverage: 'full', ledgerEntryId: 'e1',
}

describe('SF-5015 Composer (render smoke, jsdom)', () => {
  it('a touched state renders "Maskiert senden" and marks the state', () => {
    render(<Composer state="touched" verdict={touched} locale="de" />)
    expect(screen.getByTestId('composer').getAttribute('data-state')).toBe('touched')
    expect(screen.getByRole('button').textContent).toBe('Maskiert senden')
  })
  it('a degraded overlay renders the rules-only strip', () => {
    render(<Composer state="clean" verdict={null} degraded locale="de" />)
    expect(screen.getByTestId('degraded-strip')).toBeTruthy()
  })
})
