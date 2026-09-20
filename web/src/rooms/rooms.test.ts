import { describe, it, expect } from 'vitest'
import { buildThresholdModel } from './buildThresholdModel'
import { buildManagementShell } from './buildManagementShell'
import { buildBriefingView } from './buildBriefingView'
import type { BriefingInputs } from '../../../core/lib/types'

describe('SF-5081 buildThresholdModel', () => {
  it('named, dated threshold that states structural aggregation (NG-13)', () => {
    const t = buildThresholdModel('38', 12)
    expect(t.headlineKey).toBe('threshold.headline')
    expect(t.bodyKey).toBe('threshold.body')
    expect(t.people).toBe(12)
  })
})

describe('SF-5082 buildManagementShell', () => {
  it('720px Fraunces document with the review nav and NO person column (NG-13)', () => {
    const s = buildManagementShell('briefing')
    expect(s.maxWidthPx).toBe(720)
    expect(s.hasPersonColumn).toBe(false)
    expect(s.navKeys).toContain('mgmt.nav.briefing')
    expect(s.navKeys).toContain('mgmt.nav.evidence')
  })
})

describe('SF-5083 buildBriefingView', () => {
  const inputs: BriefingInputs = {
    week: 'KW 38', people: 8,
    stats: { requests: 40, redactedForwarded: 30, blocked: 1, rulesOnlyRequests: 0 },
    findings: [{ theme: 'gleiche Lieferantendokumente', area: 'lieferanten-konditionen', clusterSize: 4, hoursSavedLow: 0.75, hoursSavedHigh: 1.0, artefact: 'ein Auszug je Vertrag' }],
    sufficient: true,
  }
  it('rows name a pseudonymised cluster + area (never a person); ≈ range + formula; no person column', () => {
    const v = buildBriefingView(inputs)
    expect(v.rows[0]?.observation).toContain('lieferanten-konditionen')
    expect(v.rows[0]?.observation).not.toMatch(/anna|berger|person/i)
    expect(v.estimate.approx).toBe(true)
    expect(v.estimate.noteKey).toBe('briefing.estimate_note')
    expect(v.hasPersonColumn).toBe(false)
    expect(v.estimate.high).toBeCloseTo(1.0)
  })
})
