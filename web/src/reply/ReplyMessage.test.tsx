import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ReplyMessage } from './ReplyMessage'
import type { RehydrateResult } from '../types'

afterEach(cleanup)

describe('SF-5034 ReplyMessage (render smoke, jsdom)', () => {
  it('partial: renders restored text + keeps the unresolved placeholder visible', () => {
    const result: RehydrateResult = {
      restoredText: 'Von Brechtmann GmbH zu ⟨Vertragsnummer⟩',
      restoredSpans: [{ placeholder: '⟨Lieferant⟩', original: 'Brechtmann GmbH', offset: 4, length: 15 }],
      unresolved: ['⟨Vertragsnummer⟩'],
    }
    render(<ReplyMessage result={result} locale="de" />)
    expect(screen.getByTestId('reply').getAttribute('data-mode')).toBe('partial')
    expect(screen.getByTestId('reply-text').textContent).toContain('⟨Vertragsnummer⟩') // stays visible
    expect(screen.getByTestId('reply-footer').textContent).toContain('offen')
  })

  it('NG-25: distinguishes a masked-open placeholder from a model gap, and asks nothing for the model gap', () => {
    const result: RehydrateResult = {
      restoredText: 'Sehr geehrte/r ⟨Empfängername⟩, zum ⟨Termin⟩. Grüße an Brechtmann GmbH.',
      restoredSpans: [{ placeholder: '⟨Lieferant⟩', original: 'Brechtmann GmbH', offset: 55, length: 15 }],
      unresolved: ['⟨Empfängername⟩', '⟨Termin⟩'],
    }
    // ⟨Termin⟩ was masked by NorthGuard (a session value exists); ⟨Empfängername⟩ is the
    // model's own blank (not in the mapping).
    render(<ReplyMessage result={result} locale="de" mapping={{ '⟨Termin⟩': 'nächsten Dienstag' }} />)
    const masked = screen.getByTestId('masked-open')
    const model = screen.getByTestId('model-gap')
    expect(masked.textContent).toContain('maskiert')
    expect(masked.textContent).toContain('⟨Termin⟩')
    expect(model.textContent).toContain('vom Modell offen gelassen')
    expect(model.textContent).not.toContain('einsetzen') // no "insert value" — never the user's homework
    // footer states both classes separately
    const footer = screen.getByTestId('reply-footer').textContent ?? ''
    expect(footer).toContain('maskierte')
    expect(footer).toContain('vom Modell offen gelassen')
  })
})
