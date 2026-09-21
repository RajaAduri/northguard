import type { ConvergenceReport, WorkingSet } from '../../../../lib/types'
import { runExtractionPass } from './runExtractionPass'
import { hasConverged } from './hasConverged'

const MATERIALITY = 0 // "adds nothing" — a pass adding ≤ this many new areas has converged
const PASS_CEILING = 5

// SF-2073 — run passes until convergence (NG-6: one convergence run per version). The
// working set is returned INERT — nothing enforces until a baseline is approved
// (NG-3/NG-22). The report is legible to the user ("N passes, the last added nothing").
export async function convergeExtraction(
  policy: string,
  opts: { materiality?: number; ceiling?: number } = {},
): Promise<{ working: WorkingSet; report: ConvergenceReport }> {
  const materiality = opts.materiality ?? MATERIALITY
  const ceiling = opts.ceiling ?? PASS_CEILING
  let working: WorkingSet = { areas: [] }
  let passes = 0
  let lastAdded = 0
  for (let i = 1; i <= ceiling; i++) {
    const res = await runExtractionPass(policy, working, i)
    working = res.working
    lastAdded = res.added
    passes = i
    if (hasConverged(res.added, materiality, i, ceiling)) break
  }
  return { working, report: { passes, lastAdded, converged: lastAdded <= materiality } }
}
