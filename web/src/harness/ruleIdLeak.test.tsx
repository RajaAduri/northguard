import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { SubmissionMirror } from '../mirror/SubmissionMirror'
import { BlockPanel } from '../mirror/BlockPanel'
import { ReportPanel } from '../report/ReportPanel'
import { buildReportForm } from '../report/buildReportForm'
import type { InspectionVerdict, RedactionSpan } from '../types'

afterEach(cleanup)

// SF-5102 (F2) — the shape fix, not the instance: NO component may surface a raw rule
// constant (RULE-…). Rule ids reach the view only through ruleDisplayName. This gate renders
// every component that shows a rule with a RULE-… id and fails if the constant appears in the
// rendered text, so a future component that forgets the mapping is caught here.
const span: RedactionSpan = {
  offset: 0, length: 3, area: 'kundendaten', layer: 'rule', ruleId: 'RULE-EMAIL',
  placeholder: '⟨E-Mail-Adresse⟩', pseudonym: 'a'.repeat(64), keyEpoch: 1,
}
const verdict = (v: 'redact' | 'block'): InspectionVerdict => ({
  verdict: v,
  touchedAreas: [{ area: 'kundendaten', mode: v === 'block' ? 'block' : 'redact', layers: ['rule'], echoBlockedSpans: v === 'block' ? false : undefined }],
  spans: [span], redactedPrompt: 'Frage ⟨E-Mail-Adresse⟩', displayPlaceholders: [], confidence: 1, caughtBy: 'rules', coverage: 'full', ledgerEntryId: 'e',
})

describe('SF-5102 rule-id leak gate', () => {
  it('no RULE- constant reaches rendered text (mirror, block, report)', () => {
    const surfaces = [
      render(<SubmissionMirror verdict={verdict('redact')} locale="de" />).container,
      render(<BlockPanel verdict={verdict('block')} locale="de" />).container,
      render(<ReportPanel form={buildReportForm(span, 'c1')} locale="de" />).container,
    ]
    for (const c of surfaces) expect(c.textContent).not.toMatch(/RULE-/)
  })
})
