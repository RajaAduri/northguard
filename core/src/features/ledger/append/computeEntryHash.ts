import { createHash } from 'node:crypto'

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']'
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}'
}

// SF-4012 — deterministic sha256 over the canonical entry (key-order independent),
// chained with prevHash so verifyChain (AF-406) can recompute it.
export function computeEntryHash(entry: object, prevHash: string): string {
  return createHash('sha256').update(prevHash + '\n' + canonicalize(entry)).digest('hex')
}
