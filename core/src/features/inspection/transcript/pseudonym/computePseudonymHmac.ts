import type { KeyMaterial } from '../../../../../lib/types'
import { computePseudonymHmac as libHmac } from '../../../../../lib/pseudonym'

// SF-3052 — HMAC over the normalised value (NG-10). Reuses the shared primitive so
// the entity pseudonym and the actor pseudonym (E4 SF-4024) share one construction.
export function computePseudonymHmac(
  normalized: string,
  key: KeyMaterial,
): { pseudonym: string; keyEpoch: number } {
  return libHmac(normalized, key)
}
