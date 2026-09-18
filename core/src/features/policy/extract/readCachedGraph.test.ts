import { describe, it, expect, beforeEach } from 'vitest'
import { readCachedGraph, putCachedGraph, clearGraphCache, putRawCacheRecord } from './readCachedGraph'
import type { ExtractedGraph } from '../../../../lib/types'

const graph: ExtractedGraph = {
  key: 'abc123',
  areas: [{ id: 'n1', label: 'Kundendaten', confirmed: false }],
  stabilityIndex: 0.9,
  stable: true,
  model: 'm',
  cached: false,
}

beforeEach(() => clearGraphCache())

describe('SF-2023 readCachedGraph (NG-6)', () => {
  it('1. a cached hash returns the graph with cached=true', () => {
    putCachedGraph('abc123', graph)
    const g = readCachedGraph('abc123')
    expect(g?.cached).toBe(true)
    expect(g?.areas[0]?.label).toBe('Kundendaten')
  })

  it('2. an unknown hash returns null', () => {
    expect(readCachedGraph('unknown')).toBeNull()
  })

  it('3. a corrupt cache record returns null (forces re-extract)', () => {
    putRawCacheRecord('bad', { not: 'a graph' })
    expect(readCachedGraph('bad')).toBeNull()
  })
})
