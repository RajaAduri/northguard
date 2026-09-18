import { describe, it, expect, vi, afterEach } from 'vitest'
import { callBackstopModel, BackstopUnavailableError } from './callBackstopModel'

afterEach(() => vi.unstubAllGlobals())
const messages = { system: 's', user: 'u' }

describe('SF-3024 callBackstopModel', () => {
  it('1. a reachable model returns the raw completion', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ completion: '{"findings":[]}' }), { status: 200 })))
    expect(await callBackstopModel(messages)).toBe('{"findings":[]}')
  })
  it('2. a failure throws BackstopUnavailableError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('refused') }))
    await expect(callBackstopModel(messages)).rejects.toThrow(BackstopUnavailableError)
  })
  it('3. deterministic decoding: temperature 0 is sent', async () => {
    const fetchMock = vi.fn(async (_u: string, _i: RequestInit) => new Response(JSON.stringify({ completion: '{}' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await callBackstopModel(messages)
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1]?.body as string) ?? '{}')
    expect(body.temperature).toBe(0)
  })
})
