import type { LedgerEntry } from '../../../../lib/types'

// ISO-week key (year + week number) for bucketing.
function isoWeek(ts: string): string {
  const d = new Date(ts)
  const day = (d.getUTCDay() + 6) % 7
  const thursday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3))
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

// SF-6011 — per-area weekly touch counts, aligned to the sorted set of weeks present.
// A clean request (no touchedAreas) contributes no touch. No userId is read (NG-13).
export function aggregateTouchesByArea(entries: LedgerEntry[]): Map<string, number[]> {
  const weeks = [...new Set(entries.filter((e) => e.kind === 'request' && e.ts).map((e) => isoWeek(e.ts)))].sort()
  const weekIndex = new Map(weeks.map((w, i) => [w, i]))
  const byArea = new Map<string, number[]>()
  for (const e of entries) {
    if (e.kind !== 'request') continue
    const wi = weekIndex.get(isoWeek(e.ts))
    if (wi === undefined) continue
    for (const area of e.touchedAreas ?? []) {
      const series = byArea.get(area) ?? new Array<number>(weeks.length).fill(0)
      series[wi] = (series[wi] ?? 0) + 1
      byArea.set(area, series)
    }
  }
  return byArea
}
