import { existsSync, readFileSync } from 'node:fs'

export const GENESIS_HASH = '0'.repeat(64)

// SF-4011 — read the chain tail. A torn final line (crash mid-write) is ignored,
// never chained onto. No ledger → genesis.
export function loadChainTail(path: string): { lastHash: string; count: number } {
  if (!existsSync(path)) return { lastHash: GENESIS_HASH, count: 0 }
  const raw = readFileSync(path, 'utf8')
  const lines = raw.split('\n').filter((l) => l.length > 0)
  let lastHash = GENESIS_HASH
  let count = 0
  for (const line of lines) {
    let parsed: { hash?: unknown }
    try {
      parsed = JSON.parse(line) as { hash?: unknown }
    } catch {
      continue // torn / malformed line — ignore, do not chain onto it
    }
    if (typeof parsed.hash !== 'string') continue
    lastHash = parsed.hash
    count += 1
  }
  return { lastHash, count }
}
