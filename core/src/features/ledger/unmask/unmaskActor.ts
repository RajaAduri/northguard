import type { Authorisation, UnmaskContext, UnmaskRequest } from '../../../../lib/types'
import { verifyDualAuthorisation } from './verifyDualAuthorisation'
import { writeUnmaskGovernanceEvent } from './writeUnmaskGovernanceEvent'
import { resolveActorIdentity } from './resolveActorIdentity'

// SF-4085 — the guarded entry point. Order (mirrors NG-5): verify two distinct-role
// authorisers → write the unmask ledger entry FIRST → resolve the identity → return.
// If authorisation fails nothing is written or resolved; if the ledger write fails the
// identity is not returned (no off-ledger unmask — NG-20).
export async function unmaskActor(
  req: UnmaskRequest,
  auths: Authorisation[],
  ctx: UnmaskContext,
): Promise<{ identity: string; ledgerEntryId: string }> {
  const authorisers = verifyDualAuthorisation(auths, ctx.roleBinding)
  const ledgerEntryId = await writeUnmaskGovernanceEvent(req.targetPseudonym, authorisers, req.reason, ctx.key)
  const identity = resolveActorIdentity(req.targetPseudonym, ctx.key, ctx.directory)
  return { identity, ledgerEntryId }
}
