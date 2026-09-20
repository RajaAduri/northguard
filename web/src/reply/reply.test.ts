import { describe, it, expect } from 'vitest'
import { buildReplyView } from './buildReplyView'
import { buildCopyModel } from './buildCopyModel'
import { buildRestoreSuggestion } from './buildRestoreSuggestion'
import type { RehydrateResult, RestoredSpan } from '../types'

const span = (): RestoredSpan => ({ placeholder: '⟨Lieferant⟩', original: 'Brechtmann GmbH', offset: 0, length: 15 })
const result = (over: Partial<RehydrateResult> = {}): RehydrateResult => ({ restoredText: 't', restoredSpans: [span()], unresolved: [], ...over })

describe('SF-5031 buildReplyView', () => {
  it('all restored → full', () => {
    expect(buildReplyView(result()).mode).toBe('full')
    expect(buildReplyView(result()).footerKey).toBe('reply.restored_full_one')
  })
  it('some unresolved → partial (stays visible, never guessed — NG-9)', () => {
    const v = buildReplyView(result({ unresolved: ['⟨Vertragsnummer⟩'] }))
    expect(v.mode).toBe('partial')
    expect(v.openCount).toBe(1)
  })
  it('nothing restored + unresolved → not-rendered', () => {
    expect(buildReplyView(result({ restoredSpans: [], unresolved: ['⟨Lieferant⟩'] })).mode).toBe('not-rendered')
  })
})

describe('SF-5032 buildCopyModel', () => {
  it('warns of real customer data when restored values are present; offers redacted copy', () => {
    const m = buildCopyModel([span()])
    expect(m.warningKey).toBe('reply.copied_warning')
    expect(m.redactedKey).toBe('reply.copy_redacted')
  })
  it('no restored values → no warning', () => {
    expect(buildCopyModel([]).warningKey).toBeNull()
  })
})

describe('SF-5033 buildRestoreSuggestion', () => {
  it('offers a suggestion + apply/leave; never auto-applies (NG-9)', () => {
    const s = buildRestoreSuggestion('⟨Lieferant⟩', { '⟨Lieferant⟩': 'Brechtmann GmbH' })
    expect(s.suggestion).toBe('Brechtmann GmbH')
    expect(s.applyKey).toBe('restore.apply')
    expect(s.keepKey).toBe('restore.keep')
  })
  it('no mapping entry → suggestion null (still no guess)', () => {
    expect(buildRestoreSuggestion('⟨X⟩', {}).suggestion).toBeNull()
  })
})
