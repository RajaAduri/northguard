import { describe, it, expect } from 'vitest'
import { shouldInvokeBackstop } from './shouldInvokeBackstop'
import type { RuleHit } from '../../../../lib/types'

const hit: RuleHit = { area: 'kundendaten', ruleId: 'RULE-EMAIL', offset: 0, length: 5, value: 'a@b.c' }

describe('SF-3022 shouldInvokeBackstop', () => {
  it('1. conclusive rule hits → false (already decided)', () => {
    expect(shouldInvokeBackstop('irgendein Text mit einer E-Mail', [hit])).toBe(false)
  })
  it('2. no hits but a substantive prompt → true', () => {
    expect(shouldInvokeBackstop('Können wir die Konditionen mit dem Zulieferer neu verhandeln?', [])).toBe(true)
  })
  it('3. a trivial clean prompt → false (latency budget)', () => {
    expect(shouldInvokeBackstop('danke', [])).toBe(false)
  })
})
