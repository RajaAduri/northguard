// AF-603 — Aggregated activity log (US-021). No per-person breakdown (NG-13).
import type { ActivityRow } from '../../../../lib/types'
import { getLedgerPath } from '../../ledger/append'
import { parseLedgerStream, filterByDateArea, projectSafeFields } from '../../ledger/query'
import { aggregateActivityRows } from './aggregateActivityRows'
import { applyAggregationGuard } from './applyAggregationGuard'

export { aggregateActivityRows } from './aggregateActivityRows'
export { applyAggregationGuard, AggregationLeakError } from './applyAggregationGuard'

export async function buildActivityLog(range: { from: string; to: string }): Promise<ActivityRow[]> {
  const entries = projectSafeFields(
    await filterByDateArea(parseLedgerStream(getLedgerPath()), { from: range.from, to: range.to }),
    'management',
  )
  return applyAggregationGuard(aggregateActivityRows(entries))
}
