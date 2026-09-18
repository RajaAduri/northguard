import { describe, it, expect, vi, afterEach } from 'vitest'
import { requestConceptGraph, SidecarUnavailableError } from './requestConceptGraph'

afterEach(() => vi.unstubAllGlobals())

const graph = {
  graph: { nodes: [{ id: 'n1', label: 'Kundendaten' }], edges: [] },
  stability_index: 0.87,
  stable: true,
  model: 'kg-gen-x',
}

describe('SF-2021 requestConceptGraph', () => {
  it('1. a reachable sidecar returns {graph, stability_index, stable, model}', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(graph), { status: 200 })))
    const g = await requestConceptGraph('Datenrichtlinie …')
    expect(g.stability_index).toBe(0.87)
    expect(g.graph.nodes[0]?.label).toBe('Kundendaten')
  })

  it('2. connection refused throws SidecarUnavailableError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed') }))
    await expect(requestConceptGraph('x')).rejects.toThrow(SidecarUnavailableError)
  })

  it('3. force=true sends the force flag (bypasses the sidecar cache)', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init: RequestInit) => new Response(JSON.stringify(graph), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await requestConceptGraph('x', { force: true })
    const init = fetchMock.mock.calls[0]?.[1]
    const body = JSON.parse((init?.body as string) ?? '{}')
    expect(body.force).toBe(true)
  })
})
