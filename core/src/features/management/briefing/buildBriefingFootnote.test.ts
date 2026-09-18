import { describe, it, expect } from 'vitest'
import { buildBriefingFootnote } from './buildBriefingFootnote'
import type { BriefingInputs } from '../../../../lib/types'

const inp = (blocked: number): BriefingInputs => ({
  week: 'KW 37', people: 8, stats: { requests: 40, redactedForwarded: 30, blocked, rulesOnlyRequests: 2 }, findings: [], sufficient: true,
})

describe('SF-6025 buildBriefingFootnote', () => {
  it('1. carries {requests, redactedForwarded, blocked, rulesOnlyRequests}', () => {
    expect(buildBriefingFootnote(inp(1))).toEqual({ requests: 40, redactedForwarded: 30, blocked: 1, rulesOnlyRequests: 2 })
  })
  it('2. zero blocked shows 0 (never hidden)', () => {
    expect(buildBriefingFootnote(inp(0)).blocked).toBe(0)
  })
})
