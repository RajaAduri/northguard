import { describe, it, expect } from 'vitest'
import { synthesizeThemes } from './synthesizeThemes'
import type { BriefingInputs, RecurringWorkFinding } from '../../../../lib/types'

const inp = (findings: RecurringWorkFinding[]): BriefingInputs => ({
  week: 'KW 37', people: 8, stats: { requests: 20, redactedForwarded: 15, blocked: 2, rulesOnlyRequests: 0 }, findings, sufficient: true,
})
const f = (theme: string, area: string, size: number, artefact: string): RecurringWorkFinding => ({ theme, area, clusterSize: size, hoursSavedLow: 1, hoursSavedHigh: 2, artefact })

describe('SF-6022 synthesizeThemes', () => {
  it('1. findings → named themes with a signal + artefact', () => {
    const t = synthesizeThemes(inp([f('gleiche Lieferantendokumente', 'lieferanten-konditionen', 4, 'ein gespeicherter Auszug je Vertrag')]))
    expect(t[0]?.title).toBe('gleiche Lieferantendokumente')
    expect(t[0]?.artefact).toContain('Auszug')
  })
  it('2. ranked by cluster size; capped at 4', () => {
    const many = [f('a', 'x', 1, 'A'), f('b', 'x', 9, 'B'), f('c', 'x', 5, 'C'), f('d', 'x', 3, 'D'), f('e', 'x', 2, 'E')]
    const t = synthesizeThemes(inp(many))
    expect(t).toHaveLength(4)
    expect(t[0]?.title).toBe('b')
  })
  it('3. empty findings → no themes (Sprint-4 partial state)', () => {
    expect(synthesizeThemes(inp([]))).toEqual([])
  })
})
