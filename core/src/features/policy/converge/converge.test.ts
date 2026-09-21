import { describe, it, expect, vi, afterEach } from 'vitest'
import { hasConverged } from './hasConverged'
import { convergeExtraction } from './convergeExtraction'

afterEach(() => vi.unstubAllGlobals())

function graphResponse(nodes: string[]) {
  return new Response(
    JSON.stringify({ graph: { nodes: nodes.map((id) => ({ id, label: id })), edges: [] }, stability_index: 0.9, stable: true, model: 'm' }),
    { status: 200 },
  )
}

describe('SF-2072 hasConverged', () => {
  it('added ≤ materiality → converged; ceiling stops regardless; else keep reading', () => {
    expect(hasConverged(0, 0, 2, 5)).toBe(true)
    expect(hasConverged(3, 0, 5, 5)).toBe(true) // ceiling
    expect(hasConverged(3, 0, 2, 5)).toBe(false)
  })
})

describe('SF-2073 convergeExtraction', () => {
  it('runs passes until a pass adds nothing; reports passes + lastAdded; working set is inert', async () => {
    // pass 1 finds 2 areas, pass 2 finds 1 more, pass 3 finds nothing new → converged
    const calls = [graphResponse(['a', 'b']), graphResponse(['a', 'b', 'c']), graphResponse(['a', 'b', 'c'])]
    let i = 0
    vi.stubGlobal('fetch', vi.fn(async () => calls[i++] ?? graphResponse(['a', 'b', 'c'])))
    const { working, report } = await convergeExtraction('Datenrichtlinie …')
    expect(report.passes).toBe(3)
    expect(report.lastAdded).toBe(0)
    expect(report.converged).toBe(true)
    expect(working.areas.map((a) => a.id).sort()).toEqual(['a', 'b', 'c'])
  })

  it('stops at the pass ceiling even if still adding', async () => {
    let n = 0
    vi.stubGlobal('fetch', vi.fn(async () => graphResponse(Array.from({ length: ++n + 1 }, (_, k) => `a${k}`))))
    const { report } = await convergeExtraction('x', { ceiling: 3 })
    expect(report.passes).toBe(3)
    expect(report.converged).toBe(false)
  })
})
