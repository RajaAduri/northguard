import { describe, it, expect } from 'vitest'
import { assessPolicyFit } from './assessPolicyFit'
import type { BriefingInputs } from '../../../../lib/types'

const inp = (requests: number, blocked: number): BriefingInputs => ({
  week: 'KW 37', people: 8, stats: { requests, redactedForwarded: 0, blocked, rulesOnlyRequests: 0 }, findings: [], sufficient: true,
})

describe('SF-6024 assessPolicyFit', () => {
  it('1. a high block share flags a possible over-fit + reports the rate', () => {
    const n = assessPolicyFit(inp(10, 3))
    expect(n.verdict).toMatch(/zu streng/)
    expect(n.falseBlockRate).toBeCloseTo(0.3)
  })
  it('2. a well-matched policy → weitgehend ja', () => {
    expect(assessPolicyFit(inp(100, 1)).verdict).toMatch(/Weitgehend ja/)
  })
})
