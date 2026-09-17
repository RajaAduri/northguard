import { createHmac } from 'node:crypto'
import type { KeyMaterial } from './types'

// Shared one-way keyed pseudonym primitive (NG-10). Used by E4 actor derivation
// (SF-4024) and E3 entity pseudonyms (SF-3052). The key lives on customer infra and
// never leaves; the output never contains the original value.
export function computePseudonymHmac(
  normalized: string,
  key: KeyMaterial,
): { pseudonym: string; keyEpoch: number } {
  const pseudonym = createHmac('sha256', `${key.secret}:${key.keyEpoch}`)
    .update(normalized)
    .digest('hex')
  return { pseudonym, keyEpoch: key.keyEpoch }
}

// Actor identifiers normalise by case + whitespace only (unlike German entity
// values, SF-3051). One person → one actor pseudonym within a key epoch.
export function normalizeActorId(userId: string): string {
  return userId.trim().toLowerCase()
}
