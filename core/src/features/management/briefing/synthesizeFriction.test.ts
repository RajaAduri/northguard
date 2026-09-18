import { describe, it, expect } from 'vitest'
import { synthesizeFriction } from './synthesizeFriction'
import type { BriefingInputs, RecurringWorkFinding } from '../../../../lib/types'

const base = (over: Partial<BriefingInputs>): BriefingInputs => ({
  week: 'KW 37', people: 8, stats: { requests: 20, redactedForwarded: 15, blocked: 2, rulesOnlyRequests: 0 }, findings: [], sufficient: true, ...over,
})
const f = (over: Partial<RecurringWorkFinding>): RecurringWorkFinding => ({ theme: 't', area: 'lieferanten-konditionen', clusterSize: 4, hoursSavedLow: 1, hoursSavedHigh: 2, artefact: 'A', ...over })

describe('SF-6023 synthesizeFriction', () => {
  it('1. repeated near-verbatim asks → a friction read', () => {
    expect(synthesizeFriction(base({ findings: [f({ clusterSize: 5 })] }))).toMatch(/Doppelarbeit/)
  })
  it('2. a solved cadence is noted', () => {
    expect(synthesizeFriction(base({ findings: [f({ cadence: 'seit Mittwoch keine Anfrage — gelöst' })] }))).toMatch(/gelöst/)
  })
  it('3. thin data → the insufficient-traffic message', () => {
    expect(synthesizeFriction(base({ sufficient: false }))).toBe('Zu wenig Verkehr für ein Briefing.')
  })
})
