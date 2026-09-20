import type { InspectionVerdict, MirrorModel } from '../types'
import { buildAttributionRow } from './buildAttributionRow'

// SF-5021 — the "what the provider receives" mirror. `wireText` is the verdict's
// redactedPrompt VERBATIM (a read-only mirror, no re-derivation — FR-08). One
// attribution row per span (span-level, NG-8).
export function buildMirrorModel(v: InspectionVerdict): MirrorModel {
  const areas = [...new Set(v.touchedAreas.map((a) => a.area))]
  return {
    headerKey: 'mirror.title',
    summary: { count: v.spans.length, areas },
    wireText: v.redactedPrompt, // byte-identical mirror
    rows: v.spans.map(buildAttributionRow),
  }
}
