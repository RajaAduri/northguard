export class PlaintextActorError extends Error {
  constructor(key: string) {
    super(
      `NG-19: the ledger never stores a plaintext user identifier (found "${key}"); use actorPseudonym.`,
    )
    this.name = 'PlaintextActorError'
  }
}

// Any key that looks like a plaintext identity for the acting user. Only
// actorPseudonym (+actorEpoch) is permitted on a ledger entry.
const FORBIDDEN = new Set(['user', 'userid', 'username', 'user_id', 'useridentifier', 'email'])

// SF-4015 — NG-19 guard. Runs before every append.
export function assertNoPlaintextActor(entry: Record<string, unknown>): void {
  for (const key of Object.keys(entry)) {
    if (FORBIDDEN.has(key.toLowerCase())) throw new PlaintextActorError(key)
  }
}
