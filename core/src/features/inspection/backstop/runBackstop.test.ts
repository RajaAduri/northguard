import { describe, it, expect, vi, afterEach } from 'vitest'
import { runBackstop } from './index'
import type { ActivePolicy } from '../../../../lib/types'

afterEach(() => vi.unstubAllGlobals())

const policy: ActivePolicy = { policyVersion: 'v1', areas: [{ id: 'kundendaten', label: 'Kundendaten', mode: 'redact' }], activatedAt: 't', activatedBy: 'lead' }
const emptyPolicy: ActivePolicy = { policyVersion: 'v1', areas: [], activatedAt: 't', activatedBy: 'lead' }

// A fetch stub: /health → 200 (available) or throw (down); /inspect → the given completion.
function stubBackstop(opts: { available: boolean; completion?: string }) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'
    if (url.includes('/health') || method === 'GET') {
      if (!opts.available) throw new TypeError('refused')
      return new Response('{"ok":true}', { status: 200 })
    }
    return new Response(JSON.stringify({ completion: opts.completion ?? '{"findings":[]}' }), { status: 200 })
  }))
}

describe('AF-302 runBackstop coverage semantics (NG-24)', () => {
  it('1. model ran to completion → coverage full', async () => {
    stubBackstop({ available: true, completion: '{"findings":[]}' })
    expect((await runBackstop({ prompt: 'x', policy })).coverage).toBe('full')
  })

  it('2. backstop UNAVAILABLE → coverage rules-only, never full (NG-24: no silent full)', async () => {
    stubBackstop({ available: false })
    const r = await runBackstop({ prompt: 'x', policy })
    expect(r.coverage).toBe('rules-only')
    expect(r.findings).toEqual([])
  })

  it('3. model reachable but returns malformed output → rules-only (inconclusive, not full)', async () => {
    stubBackstop({ available: true, completion: 'not json' })
    expect((await runBackstop({ prompt: 'x', policy })).coverage).toBe('rules-only')
  })

  it('4. the backstop is invoked even when the caller already had rule hits (no skip)', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/health')) return new Response('{"ok":true}', { status: 200 })
      return new Response(JSON.stringify({ completion: '{"findings":[]}' }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    await runBackstop({ prompt: 'Angebot an a@b.de zu Vertrag CN-1', policy })
    // one /health + one /inspect: the model was consulted despite rule-detectable entities.
    expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('/inspect'))).toBe(true)
  })

  it('5. a policy with no model-relevant area → full (no model layer configured)', async () => {
    stubBackstop({ available: false }) // even if it would be down, no layer is configured
    expect((await runBackstop({ prompt: 'x', policy: emptyPolicy })).coverage).toBe('full')
  })
})
