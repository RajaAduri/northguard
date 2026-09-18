import type { LedgerEntry, Narrowing, NarrowPreview, RuleId } from '../../../../lib/types'

// SF-6043 — the 30-day impact preview. `before` (current hits of the rule) is counted
// deterministically from the ledger window via spanPseudonyms.ruleId. The `after`
// count requires re-evaluating the narrowed rule over the ORIGINAL prompts, which the
// ledger does not retain (NG-10) — so it is supplied as a measured figure (from a
// separate re-evaluation / full-text-opt-in sample). When absent, the preview reports
// `measured:false` and states the residual risk, rather than fabricating a number.
export function previewRuleNarrowing(rule: RuleId, narrowing: Narrowing, window: LedgerEntry[]): NarrowPreview {
  const before =
    narrowing.measuredBefore ??
    window.filter((e) => (e.spanPseudonyms ?? []).some((s) => s.ruleId === rule)).length
  const measured = narrowing.measuredAfter !== undefined
  const after = narrowing.measuredAfter ?? before
  return {
    ruleId: rule,
    before,
    after,
    reportsResolved: narrowing.reportsResolved ?? 0,
    residualRisk:
      narrowing.residualRisk ??
      (measured ? '' : 're-evaluation over originals pending (measured separately) — after-count is a placeholder'),
    measured,
  }
}
