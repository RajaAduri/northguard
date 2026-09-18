import { describe, it, expect } from 'vitest'
import { sortByRepeatFrequency } from './sortByRepeatFrequency'
import type { TriggerGroup } from '../../../../lib/types'

const g = (key: string, count: number, latestTs: string, resolved = false): TriggerGroup => ({
  key, layer: 'rule', area: 'a', count, distinctReporters: 1, latestTs, resolved,
})

describe('SF-6042 sortByRepeatFrequency', () => {
  it('1. sorted desc by count (repeat offenders on top)', () => {
    expect(sortByRepeatFrequency([g('a', 2, 't1'), g('b', 9, 't1'), g('c', 5, 't1')]).map((x) => x.key)).toEqual(['b', 'c', 'a'])
  })
  it('2. ties broken by most-recent report', () => {
    expect(sortByRepeatFrequency([g('a', 3, '2026-09-01'), g('b', 3, '2026-09-20')]).map((x) => x.key)).toEqual(['b', 'a'])
  })
  it('3. resolved groups sort below open ones', () => {
    expect(sortByRepeatFrequency([g('done', 9, 't1', true), g('open', 1, 't1', false)]).map((x) => x.key)).toEqual(['open', 'done'])
  })
})
