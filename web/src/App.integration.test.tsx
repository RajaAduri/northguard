import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import type { InspectionVerdict } from './types'
import { briefingInputsFixture } from './rooms/managementFixtures'

// SF-5099 — the integration gate. It mounts the REAL App (not the harness) with a mocked
// gateway and asserts the surfaces the audit found unreachable are actually reachable:
// the report flow opens, the view toggle appears after the first send, the reply footer
// renders, and the management DOCUMENT renders (not raw markdown). A green orphan test says
// a component is imported; this says the user can actually reach it.
const clean: InspectionVerdict = {
  verdict: 'clean', touchedAreas: [], spans: [], redactedPrompt: 'hallo welt',
  displayPlaceholders: [], confidence: 1, caughtBy: null, coverage: 'full', ledgerEntryId: 'c',
}
const touched: InspectionVerdict = {
  verdict: 'redact',
  touchedAreas: [{ area: 'Kundendaten', mode: 'redact', layers: ['rule'] }],
  spans: [{ offset: 0, length: 4, area: 'Kundendaten', layer: 'rule', ruleId: 'RULE-EMAIL', placeholder: '⟨E-Mail-Adresse 1⟩', pseudonym: 'a'.repeat(64), keyEpoch: 1 }],
  redactedPrompt: '⟨E-Mail-Adresse 1⟩ zu den Konditionen', displayPlaceholders: [], confidence: 1, caughtBy: 'rules', coverage: 'full', ledgerEntryId: 't',
}

vi.mock('./apiClient', () => ({
  inspect: vi.fn(async (draft: string) => (draft.includes('mail') ? touched : clean)),
  forward: vi.fn(async () => 'Antwort vom EU-gehosteten Endpunkt'),
  briefing: vi.fn(async () => ({ markdown: '# raw', inputs: briefingInputsFixture, sufficient: true, findings: 3 })),
  health: vi.fn(async () => ({ ok: true, backstop: true, sidecar: true })),
}))

import { App } from './App'

afterEach(cleanup)

describe('SF-5099 App integration (real App, mocked gateway)', () => {
  it('the report flow opens from a touched finding', async () => {
    render(<App />)
    fireEvent.change(screen.getByTestId('composer-input'), { target: { value: 'schreib eine mail' } })
    await waitFor(() => expect(screen.getByTestId('composer').getAttribute('data-state')).toBe('touched'), { timeout: 3000 })
    fireEvent.click(screen.getByText('Fehlalarm melden'))
    expect(screen.getByTestId('report-panel')).toBeTruthy()
    expect(screen.getByTestId('report-privacy')).toBeTruthy()
  })

  it('a send renders the reply footer and reveals the view toggle', async () => {
    render(<App />)
    fireEvent.change(screen.getByTestId('composer-input'), { target: { value: 'hallo welt' } })
    fireEvent.click(screen.getByTestId('send-button'))
    await waitFor(() => expect(screen.getByTestId('reply')).toBeTruthy(), { timeout: 3000 })
    expect(screen.getByTestId('reply-footer')).toBeTruthy()
    expect(screen.getByTestId('view-toggle')).toBeTruthy()
  })

  it('the management room renders the briefing DOCUMENT, not raw markdown', async () => {
    render(<App />)
    fireEvent.click(screen.getByText('Managementsicht'))
    fireEvent.click(screen.getByText('Woche ansehen')) // the threshold enter
    await waitFor(() => expect(screen.getByTestId('briefing-document')).toBeTruthy(), { timeout: 3000 })
    expect(screen.getByTestId('management-view').getAttribute('data-person-column')).toBe('false')
    expect(screen.queryByText('# raw')).toBeNull() // never the raw markdown
  })
})
