import type { ActivityRow, LedgerEntry } from '../../../../lib/types'

// SF-6031 — activity rows aggregated by date (day) + area + verdict. A clean request
// (no touched area) aggregates under area '--'. No per-person breakdown (NG-13).
export function aggregateActivityRows(entries: LedgerEntry[]): ActivityRow[] {
  const counts = new Map<string, ActivityRow>()
  for (const e of entries) {
    if (e.kind !== 'request' || !e.ts) continue
    const date = e.ts.slice(0, 10)
    const verdict = e.verdict ?? 'clean'
    const areas = (e.touchedAreas ?? []).length > 0 ? (e.touchedAreas as string[]) : ['--']
    for (const area of areas) {
      const key = `${date}|${area}|${verdict}`
      const row = counts.get(key) ?? { date, area, verdict, count: 0 }
      row.count += 1
      counts.set(key, row)
    }
  }
  return [...counts.values()].sort((a, b) => a.date.localeCompare(b.date) || a.area.localeCompare(b.area))
}
