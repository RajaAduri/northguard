// AF-202 — Extract protected concepts once per policy version (NG-6).
import type { ExtractedGraph } from '../../../../lib/types'
import { requestConceptGraph } from './requestConceptGraph'
import { mapGraphToAreas } from './mapGraphToAreas'
import { readCachedGraph, putCachedGraph } from './readCachedGraph'

export { requestConceptGraph, SidecarUnavailableError } from './requestConceptGraph'
export { mapGraphToAreas } from './mapGraphToAreas'
export { readCachedGraph, putCachedGraph, clearGraphCache } from './readCachedGraph'

// Extraction is keyed by policyHash; a known hash serves the cache with no sidecar
// call (NG-6, FR-03). force bypasses both caches.
export async function extractProtectedConcepts(input: {
  normalized: string
  policyHash: string
  force?: boolean
}): Promise<ExtractedGraph> {
  if (!input.force) {
    const cached = readCachedGraph(input.policyHash)
    if (cached) return cached
  }
  const raw = await requestConceptGraph(input.normalized, { force: input.force ?? false })
  const graph: ExtractedGraph = {
    key: input.policyHash,
    areas: mapGraphToAreas(raw),
    stabilityIndex: raw.stability_index,
    stable: raw.stable,
    model: raw.model,
    cached: false,
  }
  putCachedGraph(input.policyHash, graph)
  return graph
}
