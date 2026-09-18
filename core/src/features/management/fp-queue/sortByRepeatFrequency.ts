import type { TriggerGroup } from '../../../../lib/types'

// SF-6042 — repeat offenders on top: open groups first, then by count desc, ties by
// most-recent report. Resolved groups sort below open ones.
export function sortByRepeatFrequency(groups: TriggerGroup[]): TriggerGroup[] {
  return [...groups].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1
    if (b.count !== a.count) return b.count - a.count
    return b.latestTs.localeCompare(a.latestTs)
  })
}
