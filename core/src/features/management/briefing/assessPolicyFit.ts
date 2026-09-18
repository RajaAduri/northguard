import type { BriefingInputs, PolicyFitNote } from '../../../../lib/types'

// SF-6024 — does the policy fit the work? An over-blocking signal (a high block share)
// flags a possible over-fit and reports the current false-block rate; otherwise
// "weitgehend ja". (The false-block rate is derived from the ledger stats available in
// the partial; the FP-queue integration enriches it later.)
export function assessPolicyFit(inp: BriefingInputs): PolicyFitNote {
  const { requests, blocked } = inp.stats
  const falseBlockRate = requests > 0 ? blocked / requests : 0
  if (blocked > 0 && falseBlockRate > 0.1) {
    return { verdict: 'Möglicherweise zu streng — hoher Blockanteil.', falseBlockRate }
  }
  return { verdict: 'Weitgehend ja.', falseBlockRate }
}
