import { describe, it, expect } from 'vitest'
import { decideVerdictMode } from './decideVerdictMode'
import type { ActivePolicy, AreaAttribution } from '../../../../lib/types'

const policy: ActivePolicy = {
  policyVersion: 'v1',
  areas: [
    { id: 'preise-margen', label: 'Preise', mode: 'redact', confirmed: true },
    { id: 'zugangsdaten', label: 'Zugangsdaten', mode: 'block', confirmed: true },
  ],
  activatedAt: 't',
  activatedBy: 'lead',
}
const attr = (area: string): AreaAttribution => ({ area, mode: 'redact', layers: ['rule'] })

describe('SF-3033 decideVerdictMode', () => {
  it('1. a touch in a block-mode area → block', () => {
    expect(decideVerdictMode([attr('zugangsdaten')], policy)).toBe('block')
  })
  it('2. touches only in redact areas → redact', () => {
    expect(decideVerdictMode([attr('preise-margen')], policy)).toBe('redact')
  })
  it('3. no touches → clean', () => {
    expect(decideVerdictMode([], policy)).toBe('clean')
  })
})
