import type { LedgerEntry } from '../../../../lib/types'

// SF-4053 — one JSON line per entry, including prevHash/hash so the bundle's chain is
// independently re-verifiable (AF-406). Order preserved.
export function buildJsonl(entries: LedgerEntry[]): string {
  return entries.map((e) => JSON.stringify(e)).join('\n')
}
