// AF-206 — Guarded, logged policy activation (US-005). The only thing that unlocks
// inspection/forwarding. guard → write governance event → publish (in that order).
import type { Area, ActivePolicy, KeyMaterial, StabilityReport } from '../../../../lib/types'
import { guardActivation } from './guardActivation'
import { writeActivationGovernanceEvent } from './writeActivationGovernanceEvent'
import { publishActivePolicy } from './publishActivePolicy'

export { guardActivation, ActivationBlockedError } from './guardActivation'
export { writeActivationGovernanceEvent } from './writeActivationGovernanceEvent'
export { publishActivePolicy, getActivePolicy, resetActivePolicy } from './publishActivePolicy'

// `key` + `policyVersion` extend the pre-amendment spec input {areas, stability, actor}:
// the governance actor is pseudonymised (NG-19) and the active policy carries its version.
export async function activatePolicyVersion(input: {
  areas: Area[]
  stability: StabilityReport
  actor: string
  key: KeyMaterial
  policyVersion: string
}): Promise<ActivePolicy> {
  guardActivation(input.areas, input.stability) // throws ActivationBlockedError (NG-3)
  const policy: ActivePolicy = {
    policyVersion: input.policyVersion,
    areas: input.areas,
    activatedAt: new Date().toISOString(),
    activatedBy: input.actor,
  }
  // NG-12: the activation is logged BEFORE it is published; if the ledger write
  // fails, activation aborts and nothing is published.
  await writeActivationGovernanceEvent(policy, input.actor, input.key)
  publishActivePolicy(policy)
  return policy
}
