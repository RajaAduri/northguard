import type { Baseline, LedgerEntry, ReviewCadence, ReviewContext, ReviewVorschlag } from '../../../../lib/types'
import { resolveCadence } from './resolveCadence'
import { detectProposals } from './detectProposals'
import { composeReviewProposal } from './composeReviewProposal'

export { resolveCadence } from './resolveCadence'
export { detectProposals } from './detectProposals'
export { composeReviewProposal } from './composeReviewProposal'

// AF-609 — the review cycle. Reads the accumulated business-event records (NG-23) and
// the profile, proposes changes with numeric evidence, applies nothing (NG-22). The
// cadence decays with baseline age unless overridden.
export function runReview(
  window: LedgerEntry[],
  profile: Baseline,
  ctx: ReviewContext,
  baselineAgeDays: number,
  cadenceOverride?: ReviewCadence,
): ReviewVorschlag {
  const cadence = resolveCadence(baselineAgeDays, cadenceOverride)
  const detected = detectProposals(window, profile, ctx)
  return composeReviewProposal(ctx.period, cadence, detected)
}
