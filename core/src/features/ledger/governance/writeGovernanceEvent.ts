import type { GovKind, KeyMaterial } from '../../../../lib/types'
import { appendLedgerEntry } from '../append'
import { buildGovernanceEntry } from './buildGovernanceEntry'

// SF-4032 — build + append a governance event in the same chain as request entries.
// Missing actor/reason throws (NG-12); actor is pseudonymised (NG-19).
export async function writeGovernanceEvent(
  kind: GovKind,
  actorId: string,
  reason: string,
  payload: unknown,
  key: KeyMaterial,
): Promise<string> {
  const entry = buildGovernanceEntry(kind, actorId, reason, payload, key)
  const { id } = await appendLedgerEntry(entry)
  return id
}
