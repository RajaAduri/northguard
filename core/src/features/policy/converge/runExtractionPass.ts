import type { WorkingSet } from '../../../../lib/types'
import { requestConceptGraph } from '../extract/requestConceptGraph'
import { mapGraphToAreas } from '../extract/mapGraphToAreas'

// SF-2071 — one extraction pass over the same policy version. Proposes additions to the
// working set (a re-read deepens it — a later pass may add what an earlier missed). New
// areas are those not already present by id. Returns { working, added }.
export async function runExtractionPass(
  policy: string,
  working: WorkingSet,
  _passIndex: number,
): Promise<{ working: WorkingSet; added: number }> {
  const graph = await requestConceptGraph(policy)
  const proposed = mapGraphToAreas(graph)
  const known = new Set(working.areas.map((a) => a.id))
  const additions = proposed.filter((a) => !known.has(a.id))
  return { working: { areas: [...working.areas, ...additions] }, added: additions.length }
}
