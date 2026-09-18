import type { LedgerEntry } from '../../../../lib/types'
import { getLedgerPath } from '../append'
import { parseLedgerStream, filterByDateArea } from '../query'

// SF-4051 — collect all entries within a range (requests + governance + ops), via the
// AF-404 query contract. An empty range yields a valid empty set.
export async function collectRange(from: string, to: string): Promise<LedgerEntry[]> {
  return filterByDateArea(parseLedgerStream(getLedgerPath()), { from, to })
}
