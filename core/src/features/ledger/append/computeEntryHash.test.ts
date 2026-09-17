import { describe, it, expect } from 'vitest'
import { computeEntryHash } from './computeEntryHash'

describe('SF-4012 computeEntryHash', () => {
  const prev = 'a'.repeat(64)

  it('1. deterministic sha256 over canonical JSON', () => {
    const e = { id: 'x', ts: '2026-01-01T00:00:00Z', kind: 'request' }
    expect(computeEntryHash(e, prev)).toBe(computeEntryHash(e, prev))
    expect(computeEntryHash(e, prev)).toMatch(/^[0-9a-f]{64}$/)
  })

  it('2. reordered keys produce the same hash (canonicalised)', () => {
    const a = { id: 'x', ts: 't', kind: 'request', verdict: 'clean' }
    const b = { verdict: 'clean', kind: 'request', ts: 't', id: 'x' }
    expect(computeEntryHash(a, prev)).toBe(computeEntryHash(b, prev))
  })

  it('2b. nested reordered keys still canonicalise', () => {
    const a = { id: 'x', payload: { b: 1, a: 2 } }
    const b = { payload: { a: 2, b: 1 }, id: 'x' }
    expect(computeEntryHash(a, prev)).toBe(computeEntryHash(b, prev))
  })

  it('3. any field change yields a different hash', () => {
    const a = { id: 'x', verdict: 'clean' }
    const b = { id: 'x', verdict: 'redact' }
    expect(computeEntryHash(a, prev)).not.toBe(computeEntryHash(b, prev))
  })

  it('3b. a different prevHash yields a different hash (chaining)', () => {
    const e = { id: 'x' }
    expect(computeEntryHash(e, 'a'.repeat(64))).not.toBe(computeEntryHash(e, 'b'.repeat(64)))
  })
})
