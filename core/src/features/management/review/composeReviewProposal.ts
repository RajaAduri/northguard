import type { Proposal, ReviewCadence, ReviewVorschlag } from '../../../../lib/types'

// SF-6093 — order the detected proposals by priority (lowest number = most urgent),
// stable within a priority. Applies NOTHING (NG-22: the only path to the profile is an
// approved Änderungsantrag). An empty proposals list is a valid outcome — "Nichts
// vorzuschlagen" is held to the same discipline as a quiet briefing week.
export function composeReviewProposal(period: string, cadence: ReviewCadence, detected: Proposal[]): ReviewVorschlag {
  const proposals = [...detected].sort((a, b) => a.priority - b.priority)
  return { period, cadence, proposals }
}
