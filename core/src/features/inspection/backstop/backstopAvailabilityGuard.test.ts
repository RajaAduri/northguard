import { describe, it, expect, vi, afterEach } from 'vitest'
import { backstopAvailabilityGuard } from './backstopAvailabilityGuard'

afterEach(() => vi.unstubAllGlobals())

describe('SF-3021 backstopAvailabilityGuard', () => {
  it('1. a healthy backstop returns true', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok', { status: 200 })))
    expect(await backstopAvailabilityGuard()).toBe(true)
  })
  it('2. a down backstop returns false (no throw)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('refused') }))
    await expect(backstopAvailabilityGuard()).resolves.toBe(false)
  })
  it('3. a non-ok status returns false', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('err', { status: 503 })))
    expect(await backstopAvailabilityGuard()).toBe(false)
  })
})
