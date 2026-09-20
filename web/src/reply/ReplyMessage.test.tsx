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
})
