import type { ExtractedGraph } from '../../../../lib/types'

// Policy-version cache: metadata only, keyed by policyHash. Extraction runs once per
// version, never per request (NG-6). In-memory for the core; a deployment may back it
// with a file store behind this same read/put surface.
const cache = new Map<string, unknown>()

function isExtractedGraph(v: unknown): v is ExtractedGraph {
  if (v === null || typeof v !== 'object') return false
  const g = v as Record<string, unknown>
  return typeof g.key === 'string' && Array.isArray(g.areas) && 'stabilityIndex' in g && typeof g.model === 'string'
}

// SF-2023 — serve a cached graph by hash; unknown or corrupt → null (forces re-extract).
export function readCachedGraph(policyHash: string): ExtractedGraph | null {
  const rec = cache.get(policyHash)
  if (!isExtractedGraph(rec)) return null
  return { ...rec, cached: true }
}

export function putCachedGraph(policyHash: string, graph: ExtractedGraph): void {
  cache.set(policyHash, graph)
}

// Test/robustness seam: store an arbitrary (possibly corrupt) record.
export function putRawCacheRecord(policyHash: string, record: unknown): void {
  cache.set(policyHash, record)
}

export function clearGraphCache(): void {
  cache.clear()
}
