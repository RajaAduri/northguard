import type { LedgerEntry } from '../../../../lib/types'

export const CSV_COLUMNS = ['ts', 'area', 'mode', 'verdict', 'caughtBy'] as const

function csvCell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

// SF-4052 — CSV over the safe columns only (no prompt/response text). A clean request
// shows area '--' and mode 'unverändert'.
export function buildCsv(entries: LedgerEntry[]): string {
  const rows = [CSV_COLUMNS.join(',')]
  for (const e of entries) {
    const areas = e.touchedAreas ?? []
    rows.push(
      [
        e.ts,
        areas.length > 0 ? areas.join('|') : '--',
        e.mode ?? 'unverändert',
        e.verdict ?? (e.kind === 'request' ? 'clean' : e.govKind ?? ''),
        e.caughtBy ?? '',
      ]
        .map((c) => csvCell(String(c)))
        .join(','),
    )
  }
  return rows.join('\n')
}
