import { describe, it, expect, vi } from 'vitest'
import { buildReportForm } from './buildReportForm'
import { submitReport } from './submitReport'
import { buildReportDone } from './buildReportDone'
import { buildReporterNotice } from './buildReporterNotice'
import type { FpReportPayload, RedactionSpan, ReportForm } from '../types'

const span: RedactionSpan = { offset: 0, length: 4, area: 'preise-margen', layer: 'rule', ruleId: 'RULE-PERCENT-PRICE', placeholder: '⟨Marge⟩', pseudonym: 'a'.repeat(64), keyEpoch: 1 }

describe('SF-5071 buildReportForm', () => {
  it('prefills from the span; share-context OFF by default (opt-in)', () => {
    const f = buildReportForm(span, 'conv-1')
    expect(f.faSpan).toBe('⟨Marge⟩')
    expect(f.area).toBe('preise-margen')
    expect(f.ruleId).toBe('RULE-PERCENT-PRICE')
    expect(f.shareContext).toBe(false)
  })
})

describe('SF-5072 submitReport (bridge B8)', () => {
  it('without opt-in, only span+rule+area cross — never the context', async () => {
    let captured: FpReportPayload | null = null
    const sink = vi.fn(async (p: FpReportPayload) => { captured = p; return { faId: 'FA-1' } })
    const form: ReportForm = { faSpan: '⟨Marge⟩', detectedBy: 'mirror.layer_rule', area: 'preise-margen', layer: 'rule', ruleId: 'RULE-PERCENT-PRICE', conversationId: 'c1', shareContext: false, context: 'der ganze Prompt-Text' }
    const { faId } = await submitReport(form, sink)
    expect(faId).toBe('FA-1')
    expect(captured!.context).toBeUndefined() // context withheld
    expect(captured!.area).toBe('preise-margen')
  })
  it('with opt-in, the context is included', async () => {
    let captured: FpReportPayload | null = null
    const sink = async (p: FpReportPayload) => { captured = p; return { faId: 'FA-2' } }
    await submitReport({ faSpan: '⟨Marge⟩', detectedBy: 'mirror.layer_rule', area: 'preise-margen', layer: 'rule', conversationId: 'c1', shareContext: true, context: 'ctx' }, sink)
    expect(captured!.context).toBe('ctx')
  })
})

describe('SF-5073 buildReportDone', () => {
  it('block → rephrase path; redact → continue-redacted path; rule stays', () => {
    expect(buildReportDone('FA-1', 3, 'block').pathForwardKey).toBe('report.rephrase')
    const d = buildReportDone('FA-1', 3, 'redact')
    expect(d.pathForwardKey).toBe('report.continue_redacted')
    expect(d.faId).toBe('FA-1')
    expect(d.ruleStaysKey).toBe('report.rule_stays')
  })
})

describe('SF-5074 buildReporterNotice', () => {
  it('pending / applied / declined — a no comes back', () => {
    expect(buildReporterNotice('pending').messageKey).toBe('notice.pending')
    expect(buildReporterNotice('applied').messageKey).toBe('notice.applied')
    expect(buildReporterNotice('declined').messageKey).toBe('notice.declined')
  })
})
