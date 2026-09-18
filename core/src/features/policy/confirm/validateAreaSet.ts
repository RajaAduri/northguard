import type { Area } from '../../../../lib/types'

// SF-2043 — non-empty set with unique labels.
export function validateAreaSet(areas: Area[]): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  if (areas.length === 0) issues.push('empty-area-set')
  const labels = areas.map((a) => a.label.trim().toLowerCase())
  if (new Set(labels).size !== labels.length) issues.push('duplicate-label')
  return { valid: issues.length === 0, issues }
}
