import type { LedgerEntry } from '../../../../lib/types'

// SF-4042 — filter a stream by date range and/or touched area.
export async function filterByDateArea(
  entries: AsyncIterable<LedgerEntry>,
  f: { from?: string; to?: string; area?: string },
): Promise<LedgerEntry[]> {
  const out: LedgerEntry[] = []
  for await (const e of entries) {
    if (f.from !== undefined && e.ts < f.from) continue
    if (f.to !== undefined && e.ts > f.to) continue
    if (f.area !== undefined && !(e.touchedAreas ?? []).includes(f.area)) continue
    out.push(e)
  }
  return out
}
