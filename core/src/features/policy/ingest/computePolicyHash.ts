import { createHash } from 'node:crypto'

// SF-2014 — content hash keyed to a policy version. Matches the sidecar policy_key():
// sha256 over the trimmed normalized text, first 16 hex chars.
export function computePolicyHash(normalized: string): string {
  return createHash('sha256').update(normalized.trim()).digest('hex').slice(0, 16)
}
