import type { DirectoryProvider, KeyMaterial } from '../../../../lib/types'
import { computePseudonymHmac, normalizeActorId } from '../../../../lib/pseudonym'

export class UnresolvedActorError extends Error {
  constructor() {
    super('no directory entry matches the pseudonym — the actor could not be resolved')
    this.name = 'UnresolvedActorError'
  }
}

// SF-4083 — recover the identity by recomputing the actor pseudonym over the
// customer's employee directory (same construction as SF-4024) and matching. The
// directory + key come from an E8-provided interface. Never guesses: no match throws.
export function resolveActorIdentity(
  targetPseudonym: string,
  key: KeyMaterial,
  dir: DirectoryProvider,
): string {
  for (const userId of dir.listUserIds()) {
    if (computePseudonymHmac(normalizeActorId(userId), key).pseudonym === targetPseudonym) return userId
  }
  throw new UnresolvedActorError()
}
