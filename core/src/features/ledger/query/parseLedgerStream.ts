import { existsSync, readFileSync } from 'node:fs'
import type { LedgerEntry } from '../../../../lib/types'

export class ChainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChainError'
  }
}

// SF-4041 — stream ledger entries. A malformed line is a ChainError, never skipped
// silently (a query/export must see the whole, intact chain). Empty ledger → nothing.
export async function* parseLedgerStream(path: string): AsyncIterable<LedgerEntry> {
  if (!existsSync(path)) return
  const lines = readFileSync(path, 'utf8').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === undefined || line.length === 0) continue
    try {
      yield JSON.parse(line) as LedgerEntry
    } catch {
      throw new ChainError(`malformed ledger line at index ${i}`)
    }
  }
}
