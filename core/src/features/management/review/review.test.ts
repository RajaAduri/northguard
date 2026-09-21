import { describe, it, expect } from 'vitest'
import { resolveCadence, detectProposals, composeReviewProposal, runReview } from './index'
import type { Baseline, LedgerEntry, ReviewContext } from '../../../../lib/types'

const profile: Baseline = {
  version: 'v1.0', createdAt: 't', approver: 'lead', basis: 'initial', changeRequestId: null, checksum: 'c',
  areas: [
    { id: 'preise-margen', label: 'Preise & Margen', mode: 'block' },
    { id: 'kundendaten', label: 'Kundendaten', mode: 'redact' },
    { id: 'lieferanten', label: 'Lieferanten', mode: 'redact' },
  ],
}
function req(areas: string[], pseudonyms: { area: string; pseudonym: string }[] = []): LedgerEntry {
  return {
    id: 'x', ts: 't', kind: 'request', prevHash: 'p', hash: 'h',
    touchedAreas: areas,
    spanPseudonyms: pseudonyms.map((p) => ({ ...p, layer: 'rule' as const, pseudonym: p.pseudonym, keyEpoch: 1 })),
  }
}

describe('SF-6091 resolveCadence', () => {
  it('decays fortnightly → monthly → quarterly with baseline age', () => {
    expect(resolveCadence(10)).toBe('fortnightly')
    expect(resolveCadence(120)).toBe('monthly')
    expect(resolveCadence(400)).toBe('quarterly')
  })
  it('an override wins over the age-based cadence', () => {
    expect(resolveCadence(10, 'quarterly')).toBe('quarterly')
  })
})

describe('SF-6092 detectProposals', () => {
  const window = [req(['preise-margen']), req(['preise-margen'])]

  it('flags a dormant area — a profile area with no hits over the window', () => {
    const p = detectProposals(window, profile, { period: '2026-09' })
    const dormant = p.filter((x) => x.kind === 'dormant-area').map((x) => x.areaRef)
    expect(dormant).toContain('kundendaten')
    expect(dormant).toContain('lieferanten')
    expect(dormant).not.toContain('preise-margen')
  })
  it('flags a mode mismatch — a block area with recurring false-positive reports', () => {
    const ctx: ReviewContext = { period: '2026-09', fpReports: [{ area: 'preise-margen', count: 4 }] }
    const p = detectProposals(window, profile, ctx)
    const mm = p.find((x) => x.kind === 'mode-mismatch')
    expect(mm?.areaRef).toBe('preise-margen')
    expect(mm?.evidence.count).toBe(4)
  })
  it('does NOT flag a mode mismatch for a redact-mode area', () => {
    const ctx: ReviewContext = { period: '2026-09', fpReports: [{ area: 'kundendaten', count: 9 }] }
    expect(detectProposals(window, profile, ctx).some((x) => x.kind === 'mode-mismatch')).toBe(false)
  })
  it('flags new business activity — a pseudonym the profile has never seen', () => {
    const w = [req(['lieferanten'], [{ area: 'lieferanten', pseudonym: 'NEW-1' }])]
    const ctx: ReviewContext = { period: '2026-09', knownPseudonyms: ['OLD-1'] }
    expect(detectProposals(w, profile, ctx).some((x) => x.kind === 'new-activity')).toBe(true)
  })
  it('proposes nothing when every area is active and nothing is reported (a valid quiet review)', () => {
    const w = [req(['preise-margen']), req(['kundendaten']), req(['lieferanten'])]
    expect(detectProposals(w, profile, { period: '2026-09' })).toEqual([])
  })
})

describe('SF-6093 composeReviewProposal', () => {
  it('orders proposals by priority (most urgent first) and applies nothing', () => {
    const v = composeReviewProposal('2026-09', 'monthly', [
      { kind: 'dormant-area', areaRef: 'a', evidence: { metric: 'hits', count: 0, period: '2026-09' }, businessValue: '', priority: 3 },
      { kind: 'synonym', evidence: { metric: 'x', count: 5, period: '2026-09' }, businessValue: '', priority: 1 },
    ])
    expect(v.proposals[0]?.kind).toBe('synonym')
    expect(v.proposals[1]?.kind).toBe('dormant-area')
    expect(v.cadence).toBe('monthly')
  })
  it('an empty proposal list is a valid Vorschlag ("Nichts vorzuschlagen")', () => {
    expect(composeReviewProposal('2026-09', 'monthly', []).proposals).toEqual([])
  })
})

describe('AF-609 runReview', () => {
  it('threads cadence + detection + composition; profile is never mutated (NG-22)', () => {
    const before = JSON.stringify(profile)
    const v = runReview([req(['preise-margen'])], profile, { period: '2026-09' }, 10)
    expect(v.cadence).toBe('fortnightly')
    expect(v.proposals.length).toBeGreaterThan(0)
    expect(JSON.stringify(profile)).toBe(before)
  })
})
