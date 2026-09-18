import { describe, it, expect } from 'vitest'
import { projectSafeFields } from './projectSafeFields'
import type { LedgerEntry } from '../../../../lib/types'

const entry = (): LedgerEntry => ({
  id: '1', ts: 't', kind: 'request', prevHash: 'p', hash: 'h',
  actorPseudonym: 'ab12', actorEpoch: 1, verdict: 'redact', touchedAreas: ['kundendaten'],
})

describe('SF-4043 projectSafeFields', () => {
  it('1. management drops the actor dimension entirely (NG-13)', () => {
    const [e] = projectSafeFields([entry()], 'management')
    expect(e?.actorPseudonym).toBeUndefined()
    expect((e as unknown as Record<string, unknown>).actorEpoch).toBeUndefined()
    expect(e?.verdict).toBe('redact')
  })
  it('2. export keeps actorPseudonym (never plaintext) (NG-19)', () => {
    const [e] = projectSafeFields([entry()], 'export')
    expect(e?.actorPseudonym).toBe('ab12')
    expect((e as unknown as Record<string, unknown>).user).toBeUndefined()
  })
  it('3. raw text is never present in either context', () => {
    const withText = { ...entry(), promptText: 'the real prompt' } as unknown as LedgerEntry
    for (const ctx of ['management', 'export'] as const) {
      const [e] = projectSafeFields([withText], ctx)
      expect((e as unknown as Record<string, unknown>).promptText).toBeUndefined()
    }
  })
})
