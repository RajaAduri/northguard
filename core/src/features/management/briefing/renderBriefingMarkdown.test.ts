import { describe, it, expect } from 'vitest'
import { renderBriefingMarkdown } from './renderBriefingMarkdown'
import type { FootnoteStats, PolicyFitNote, Theme } from '../../../../lib/types'

const foot: FootnoteStats = { requests: 40, redactedForwarded: 30, blocked: 1, rulesOnlyRequests: 0 }
const fit: PolicyFitNote = { verdict: 'Weitgehend ja.' }
const header = { week: 'KW 37', people: 8 }

describe('SF-6026 renderBriefingMarkdown', () => {
  it('1. renders a short letter with the KW/people header + footnote stats', () => {
    const themes: Theme[] = [{ title: 'gleiche Lieferantendokumente', signal: '4 Anfragen', artefact: 'ein Auszug je Vertrag' }]
    const md = renderBriefingMarkdown(header, themes, 'etwas Doppelarbeit', fit, foot)
    expect(md).toContain('# Briefing · KW 37 · 8 Personen')
    expect(md).toContain('gleiche Lieferantendokumente')
    expect(md).toContain('40 Anfragen')
  })
  it('2. deterministic: same inputs → same letter (regenerable, FR-13)', () => {
    expect(renderBriefingMarkdown(header, [], 'x', fit, foot)).toBe(renderBriefingMarkdown(header, [], 'x', fit, foot))
  })
  it('3. no themes → the quiet-week Betriebsruhe variant', () => {
    expect(renderBriefingMarkdown(header, [], 'ruhig', fit, foot)).toContain('Betriebsruhe')
  })
})
