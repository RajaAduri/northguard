import { describe, it, expect } from 'vitest'
import { buildJsonl } from './buildJsonl'
import type { LedgerEntry } from '../../../../lib/types'

const e = (id: string): LedgerEntry => ({ id, ts: 't', kind: 'request', prevHash: 'p' + id, hash: 'h' + id })

describe('SF-4053 buildJsonl', () => {
  it('1. one line each, incl prevHash/hash (verifiable)', () => {
    const lines = buildJsonl([e('1'), e('2')]).split('\n')
    expect(lines).toHaveLength(2)
    expect(JSON.parse(lines[0]!).prevHash).toBe('p1')
    expect(JSON.parse(lines[0]!).hash).toBe('h1')
  })
  it('2. output is re-parseable', () => {
    for (const line of buildJsonl([e('1')]).split('\n')) expect(() => JSON.parse(line)).not.toThrow()
  })
  it('3. order is preserved', () => {
    expect(buildJsonl([e('3'), e('1'), e('2')]).split('\n').map((l) => JSON.parse(l).id)).toEqual(['3', '1', '2'])
  })
})
