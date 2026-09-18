import type { ActivePolicy, KeyMaterial } from '../../../../lib/types'
import { writeGovernanceEvent } from '../../ledger/governance'

// SF-2062 — record the activation as a governance event (NG-12), before the active
// policy is published. Note: `key` is required because governance actors are
// pseudonymised (NG-19); the pre-amendment spec signature (p, actor) predates that.
export async function writeActivationGovernanceEvent(
  p: ActivePolicy,
  actor: string,
  key: KeyMaterial,
): Promise<string> {
  const areaModes = p.areas.map((a) => ({ id: a.id, mode: a.mode ?? 'redact' }))
  return writeGovernanceEvent(
    'activation',
    actor,
    `activate policy ${p.policyVersion}`,
    { policyVersion: p.policyVersion, areaModes, activatedAt: p.activatedAt },
    key,
  )
}
