import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { App } from './App'
import { formatMessage } from './i18n'

afterEach(cleanup)

// SF-5017 — the regression that the shipped surface violated: App bypassed the state
// machine and hardcoded "Maskiert senden" on the button in every state, including an empty
// composer. An empty composer is clean; it must read "Senden" (Handoff rule 1).
describe('SF-5017 App composer (shipped-bug regression)', () => {
  it('the empty composer reads "Senden", never "Maskiert senden"', () => {
    render(<App />)
    const send = screen.getByTestId('send-button')
    expect(send.textContent).toBe(formatMessage('composer.send', 'de'))
    expect(send.textContent).not.toBe(formatMessage('composer.send_redacted', 'de'))
  })

  it('the empty composer is in the idle state and drives the real Composer component', () => {
    render(<App />)
    expect(screen.getByTestId('composer').getAttribute('data-state')).toBe('idle')
  })
})
