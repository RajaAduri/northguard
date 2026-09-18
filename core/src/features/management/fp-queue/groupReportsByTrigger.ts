import type { FpReport, TriggerGroup } from '../../../../lib/types'

// SF-6041 — group reports by their trigger (layer + area + rule), NOT by reporter
// (NG-13). Each group counts total reports and distinct reporters.
export function groupReportsByTrigger(reports: FpReport[]): TriggerGroup[] {
  const groups = new Map<string, { group: TriggerGroup; reporters: Set<string>; allResolved: boolean }>()
  for (const r of reports) {
    const key = `${r.layer}|${r.area}|${r.ruleId ?? ''}`
    const existing = groups.get(key)
    if (existing) {
      existing.group.count += 1
      existing.reporters.add(r.reporter)
      existing.group.distinctReporters = existing.reporters.size
      if (r.ts > existing.group.latestTs) existing.group.latestTs = r.ts
      existing.allResolved = existing.allResolved && r.resolved === true
      existing.group.resolved = existing.allResolved
    } else {
      const g: TriggerGroup = {
        key,
        layer: r.layer,
        area: r.area,
        ...(r.ruleId ? { ruleId: r.ruleId } : {}),
        count: 1,
        distinctReporters: 1,
        latestTs: r.ts,
        resolved: r.resolved === true,
      }
      groups.set(key, { group: g, reporters: new Set([r.reporter]), allResolved: r.resolved === true })
    }
  }
  return [...groups.values()].map((v) => v.group)
}
