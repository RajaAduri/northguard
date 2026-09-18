import { describe, it, expect } from 'vitest'
import { buildBackstopPrompt } from './buildBackstopPrompt'
import type { ActivePolicy } from '../../../../lib/types'

const policy: ActivePolicy = {
  policyVersion: 'v1',
  areas: [
    { id: 'kundendaten', label: 'Kundendaten', mode: 'redact', confirmed: true },
    { id: 'preise-margen', label: 'Preise & Margen', mode: 'redact', confirmed: true },
  ],
  activatedAt: 't',
  activatedBy: 'lead',
}

describe('SF-3023 buildBackstopPrompt', () => {
  it('1. the system prompt lists the active areas', () => {
    const m = buildBackstopPrompt('Prompt', policy)
    expect(m.system).toContain('Kundendaten')
    expect(m.system).toContain('Preise & Margen')
  })
  it('2. the user content wraps the prompt', () => {
    expect(buildBackstopPrompt('geheime Marge', policy).user).toContain('geheime Marge')
  })
  it('3. it asks for JSON only (touched areas + spans + reason)', () => {
    const m = buildBackstopPrompt('x', policy)
    expect(m.system.toLowerCase()).toContain('json')
    expect(m.system.toLowerCase()).toContain('span')
  })
})
