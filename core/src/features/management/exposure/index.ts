// AF-601 — Exposure concentration over time (US-019). Aggregated across the team,
// no user dimension (NG-13). Reads the ledger via the management projection.
import type { AreaExposure, AreaMode } from '../../../../lib/types'
import { getLedgerPath } from '../../ledger/append'
import { parseLedgerStream, filterByDateArea, projectSafeFields } from '../../ledger/query'
import { aggregateTouchesByArea } from './aggregateTouchesByArea'
import { computeAreaTrend } from './computeAreaTrend'
import { orderByConcentration } from './orderByConcentration'

export { aggregateTouchesByArea } from './aggregateTouchesByArea'
export { computeAreaTrend } from './computeAreaTrend'
export { orderByConcentration } from './orderByConcentration'

export async function computeExposureConcentration(range: { from: string; to: string }): Promise<AreaExposure[]> {
  const entries = projectSafeFields(
    await filterByDateArea(parseLedgerStream(getLedgerPath()), { from: range.from, to: range.to }),
    'management',
  )
  // best-effort per-area mode from the recorded verdict mode when the area was touched
  const modeByArea = new Map<string, AreaMode>()
  for (const e of entries) {
    if (e.mode === 'block' || e.mode === 'redact') for (const area of e.touchedAreas ?? []) {
      if (!modeByArea.has(area)) modeByArea.set(area, e.mode)
    }
  }
  const byArea = aggregateTouchesByArea(entries)
  const areas: AreaExposure[] = [...byArea.entries()].map(([area, series]) => ({
    area,
    mode: modeByArea.get(area) ?? 'redact',
    touches: series.reduce((a, b) => a + b, 0),
    trend: computeAreaTrend(series),
    series,
  }))
  return orderByConcentration(areas)
}
