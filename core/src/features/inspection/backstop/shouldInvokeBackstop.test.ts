import { describe, it, expect } from 'vitest'
import { shouldInvokeBackstop } from './shouldInvokeBackstop'
import type { ActivePolicy } from '../../../../lib/types'

const policy = (areas: ActivePolicy['areas']): ActivePolicy => ({ policyVersion: 'v1', areas, activatedAt: 't', activatedBy: 'lead' })
const withAreas = policy([{ id: 'kundendaten', label: 'Kundendaten', mode: 'redact' }])
const noAreas = policy([])

describe('SF-3022 shouldInvokeBackstop (policy-based, NG-24)', () => {
  it('1. a policy with a model-relevant area → true, regardless of the prompt or rule hits', () => {
    expect(shouldInvokeBackstop(withAreas)).toBe(true)
  })
  it('2. a policy with no areas → false (no model layer to run)', () => {
    expect(shouldInvokeBackstop(noAreas)).toBe(false)
  })
  it('3. it does NOT consult rule hits or prompt length — there is no skip heuristic', () => {
    // Same policy → same answer whether the caller has rule hits or a one-word prompt.
    expect(shouldInvokeBackstop(withAreas)).toBe(true)
  })
})
