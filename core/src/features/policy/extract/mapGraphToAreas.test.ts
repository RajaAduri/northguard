import { describe, it, expect } from 'vitest'
import { mapGraphToAreas } from './mapGraphToAreas'
import type { SidecarGraph } from '../../../../lib/types'

const base = { stability_index: 0.9, stable: true, model: 'm' }

describe('SF-2022 mapGraphToAreas', () => {
  it('1. nodes with labels become one Area per protected concept', () => {
    const g: SidecarGraph = {
      ...base,
      graph: {
        nodes: [
          { id: 'n1', label: 'Kundendaten', kind: 'area' },
          { id: 'n2', label: 'Lieferanten & Konditionen', kind: 'area' },
        ],
        edges: [],
      },
    }
    const areas = mapGraphToAreas(g)
    expect(areas.map((a) => a.label)).toEqual(['Kundendaten', 'Lieferanten & Konditionen'])
    expect(areas.every((a) => a.confirmed === false)).toBe(true)
  })

  it('2. edges attach provenance/relationships to areas', () => {
    const g: SidecarGraph = {
      ...base,
      graph: {
        nodes: [{ id: 'n1', label: 'Preise & Margen' }],
        edges: [{ from: 'n1', to: 'policy', rel: 'defined-in' }],
      },
    }
    expect(mapGraphToAreas(g)[0]?.provenance).toContain('defined-in')
  })

  it('3. an empty graph returns [] (caller treats as extraction failure)', () => {
    expect(mapGraphToAreas({ ...base, graph: { nodes: [], edges: [] } })).toEqual([])
  })
})
