import type { Area, SidecarGraph } from '../../../../lib/types'

// SF-2022 — map the sidecar node/edge graph into user-facing Area[] (label + kind
// + provenance). One Area per protected concept node; edges attach provenance.
export function mapGraphToAreas(g: SidecarGraph): Area[] {
  const { nodes, edges } = g.graph
  return nodes.map((n) => {
    const rels = edges
      .filter((e) => e.from === n.id || e.to === n.id)
      .map((e) => e.rel ?? `${e.from}->${e.to}`)
    const area: Area = { id: n.id, label: n.label, confirmed: false }
    if (n.kind !== undefined) area.kind = n.kind
    if (rels.length > 0) area.provenance = rels.join(', ')
    return area
  })
}
