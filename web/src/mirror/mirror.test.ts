import { describe, it, expect } from 'vitest'
import { buildMirrorModel } from './buildMirrorModel'
import { buildBlockModel } from './buildBlockModel'
import { buildAttributionRow } from './buildAttributionRow'
import type { InspectionVerdict, RedactionSpan } from '../types'

const span = (over: Partial<RedactionSpan> = {}): RedactionSpan => ({
  offset: 0, length: 4, area: 'lieferanten-konditionen', layer: 'rule', ruleId: 'RULE-CONTRACT', placeholder: '⟨Vertragsnummer⟩', pseudonym: 'a'.repeat(64), keyEpoch: 1, ...over,
})
const verdict = (over: Partial<InspectionVerdict> = {}): InspectionVerdict => ({
  verdict: 'redact', touchedAreas: [{ area: 'lieferanten-konditionen', mode: 'redact', layers: ['rule'] }],
  spans: [span()], redactedPrompt: 'Frage zu ⟨Vertragsnummer⟩', displayPlaceholders: [], confidence: 1, caughtBy: 'rules', coverage: 'full', ledgerEntryId: 'e1', ...over,
})

describe('SF-5021 buildMirrorModel', () => {
  it('wireText is byte-identical to redactedPrompt (read-only mirror, FR-08)', () => {
    const v = verdict()
    expect(buildMirrorModel(v).wireText).toBe(v.redactedPrompt)
  })
  it('one attribution row per span (span-level, NG-8)', () => {
    const m = buildMirrorModel(verdict({ spans: [span(), span({ area: 'kundendaten', placeholder: '⟨E-Mail⟩' })] }))
    expect(m.rows).toHaveLength(2)
    expect(m.summary.count).toBe(2)
  })
})

describe('SF-5022 buildBlockModel', () => {
  it('quotes detected spans, carries the ledger note + the no-approval sentence', () => {
    const b = buildBlockModel(verdict({ verdict: 'block' }))
    expect(b.detected[0]?.value).toBe('⟨Vertragsnummer⟩')
    expect(b.ledgerNoteKey).toBe('block.ledger_note')
    expect(b.noApprovalKey).toBe('block.no_approval')
    expect('send' in b).toBe(false) // no send variant on a block
  })
})

describe('SF-5023 buildAttributionRow', () => {
  it('rule → layer_rule + ruleId; llm → layer_ai', () => {
    expect(buildAttributionRow(span())).toMatchObject({ layerLabelKey: 'mirror.layer_rule', ruleId: 'RULE-CONTRACT' })
    expect(buildAttributionRow(span({ layer: 'llm', ruleId: undefined })).layerLabelKey).toBe('mirror.layer_ai')
  })
})
