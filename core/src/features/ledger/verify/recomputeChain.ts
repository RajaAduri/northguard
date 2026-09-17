import { existsSync, readFileSync } from 'node:fs'
import { computeEntryHash } from '../append/computeEntryHash'
import { GENESIS_HASH } from '../append/loadChainTail'

// SF-4061 (AF-406) — recompute the whole chain from genesis. Returns the first
// broken index if any entry's stored hash or prevHash link does not match.
export async function recomputeChain(
  path: string,
): Promise<{ ok: boolean; brokenAt?: number }> {
  if (!existsSync(path)) return { ok: true }
  const lines = readFileSync(path, 'utf8').split('\n').filter((l) => l.length > 0)
  let prev = GENESIS_HASH
  for (let i = 0; i < lines.length; i++) {
    let entry: Record<string, unknown>
    try {
      entry = JSON.parse(lines[i] as string) as Record<string, unknown>
    } catch {
      return { ok: false, brokenAt: i }
    }
    const { hash, ...rest } = entry
    if (rest.prevHash !== prev) return { ok: false, brokenAt: i }
    if (computeEntryHash(rest, prev) !== hash) return { ok: false, brokenAt: i }
    prev = hash as string
  }
  return { ok: true }
}
