import { describe, it, expect } from 'vitest'
import { guardActivation, ActivationBlockedError } from './guardActivation'
import type { Area, StabilityReport } from '../../../../lib/types'

const stable: StabilityReport = { index: 0.9, threshold: 0.8, stable: true }
const unstable: StabilityReport = { index: 0.5, threshold: 0.8, stable: false, blockingReason: 'below-threshold' }
const goodAreas: Area[] = [
  { id: '1', label: 'Kundendaten', mode: 'redact', confirmed: true },
  { id: '2', label: 'Zugangsdaten', mode: 'block', confirmed: true },
]

describe('SF-2061 guardActivation (NG-3)', () => {
  it('1. an unstable extraction throws ActivationBlockedError(unstable)', () => {
    expect(() => guardActivation(goodAreas, unstable)).toThrow(ActivationBlockedError)
    try {
      guardActivation(goodAreas, unstable)
    } catch (e) {
      expect((e as ActivationBlockedError).reason).toBe('unstable')
    }
  })
  it('2. an invalid area set throws invalid-areas', () => {
    try {
      guardActivation([], stable)
    } catch (e) {
      expect((e as ActivationBlockedError).reason).toBe('invalid-areas')
    }
  })
  it('3. an unassigned mode throws unassigned-mode', () => {
    try {
      guardActivation([{ id: '1', label: 'K', confirmed: true }], stable)
    } catch (e) {
      expect((e as ActivationBlockedError).reason).toBe('unassigned-mode')
    }
  })
  it('4. a stable, valid, mode-assigned set passes (no throw)', () => {
    expect(() => guardActivation(goodAreas, stable)).not.toThrow()
  })
})
