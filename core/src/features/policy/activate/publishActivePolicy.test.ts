import { describe, it, expect, beforeEach } from 'vitest'
import { publishActivePolicy, getActivePolicy, resetActivePolicy } from './publishActivePolicy'
import type { ActivePolicy } from '../../../../lib/types'

const v = (version: string): ActivePolicy => ({
  policyVersion: version,
  areas: [{ id: '1', label: 'K', mode: 'redact', confirmed: true }],
  activatedAt: '2026-09-17T00:00:00Z',
  activatedBy: 'lead',
})

beforeEach(() => resetActivePolicy())

describe('SF-2063 publishActivePolicy', () => {
  it('1. a published policy is readable by inspection', () => {
    publishActivePolicy(v('abc'))
    expect(getActivePolicy()?.policyVersion).toBe('abc')
  })
  it('2. a superseding activation retires the prior version', () => {
    publishActivePolicy(v('abc'))
    publishActivePolicy(v('def'))
    expect(getActivePolicy()?.policyVersion).toBe('def')
  })
  it('3. no active policy → inspection has nothing to forward (fresh-install lock)', () => {
    expect(getActivePolicy()).toBeNull()
  })
})
