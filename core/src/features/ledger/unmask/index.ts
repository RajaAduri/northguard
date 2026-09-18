// AF-408 — Dual-key actor unmask (US-031, NG-20). Interface + ledger semantics; the
// secret store + role binding are an E8 concern (DirectoryProvider/RoleBinding injected).
export { buildUnmaskRequest } from './buildUnmaskRequest'
export { verifyDualAuthorisation, DualAuthorisationError } from './verifyDualAuthorisation'
export { resolveActorIdentity, UnresolvedActorError } from './resolveActorIdentity'
export { writeUnmaskGovernanceEvent } from './writeUnmaskGovernanceEvent'
export { unmaskActor } from './unmaskActor'
