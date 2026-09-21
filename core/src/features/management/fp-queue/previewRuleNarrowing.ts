import type { LedgerEntry, Narrowing, NarrowPreview, RuleId } from '../../../../lib/types'

function firedRule(e: LedgerEntry, rule: RuleId): boolean {
  return (e.spanPseudonyms ?? []).some((s) => s.ruleId === rule) || (e.features ?? []).some((f) => f.name === `rule:${rule}` && f.value === true)
}
function hasFeature(e: LedgerEntry, name: string): boolean {
  return (e.features ?? []).some((f) => f.name === name && f.value === true)
}
function featureKnown(window: LedgerEntry[], name: string): boolean {
  return window.some((e) => (e.features ?? []).some((f) => f.name === name))
}

// SF-6043 (Amendment B F3) — the 30-day impact preview. `before` = window entries where
// the rule fired. When the narrowing adds a condition expressible in the stored
// structural features (NG-23), `after` is computed for real (entries that still fire
// after the extra condition) and `measured:true`. If the required feature was never
// captured, the after-count is NOT fabricated: `measured:false` with a stated reason.
export function previewRuleNarrowing(rule: RuleId, narrowing: Narrowing, window: LedgerEntry[]): NarrowPreview {
  const fired = window.filter((e) => firedRule(e, rule))
  const before = fired.length
  const req = narrowing.requiresFeature

  if (req === undefined || !featureKnown(window, req)) {
    return {
      ruleId: rule,
      before,
      after: before,
      reportsResolved: narrowing.reportsResolved ?? 0,
      residualRisk: narrowing.residualRisk ?? `narrowing not expressible in the stored features (${req ?? 'no feature specified'}) — re-evaluation over originals required`,
      measured: false,
    }
  }

  const after = fired.filter((e) => hasFeature(e, req)).length
  return {
    ruleId: rule,
    before,
    after,
    reportsResolved: narrowing.reportsResolved ?? before - after,
    residualRisk: narrowing.residualRisk ?? `entries without ${req} would no longer be caught by ${rule}`,
    measured: true,
  }
}
