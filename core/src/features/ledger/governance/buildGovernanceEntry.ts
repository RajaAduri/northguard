import type { GovKind, KeyMaterial, LedgerEntry } from '../../../../lib/types'
import { computePseudonymHmac, normalizeActorId } from '../../../../lib/pseudonym'

// SF-4031 — build a governance entry. NG-12: reason mandatory. NG-19: the acting
// party is stored as a pseudonym, never a plaintext id (accountability preserved;
// recovery is the dual-key unmask, AF-408). No key material is ever placed on the entry.
export function buildGovernanceEntry(
  kind: GovKind,
  actorId: string,
  reason: string,
  payload: unknown,
  key: KeyMaterial,
): Partial<LedgerEntry> {
  if (actorId.trim().length === 0) throw new Error('NG-12: a governance event requires an actor')
  if (reason.trim().length === 0) throw new Error('NG-12: a governance event requires a reason')
  const { pseudonym, keyEpoch } = computePseudonymHmac(normalizeActorId(actorId), key)
  return {
    kind: 'governance',
    govKind: kind,
    actorPseudonym: pseudonym,
    actorEpoch: keyEpoch,
    reason,
    payload,
  }
}
