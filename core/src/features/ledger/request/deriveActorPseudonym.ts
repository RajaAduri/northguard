import type { KeyMaterial } from '../../../../lib/types'
import { computePseudonymHmac, normalizeActorId } from '../../../../lib/pseudonym'

// SF-4024 — actorPseudonym = HMAC(key, normalize(userId)) (NG-19). Same construction
// as entity pseudonyms (E3 SF-3052), via the shared lib primitive. The raw id never
// appears in the output; an actor resolves stably across their own requests.
export function deriveActorPseudonym(
  userId: string,
  key: KeyMaterial,
): { actorPseudonym: string; actorEpoch: number } {
  const { pseudonym, keyEpoch } = computePseudonymHmac(normalizeActorId(userId), key)
  return { actorPseudonym: pseudonym, actorEpoch: keyEpoch }
}
