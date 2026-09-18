import type { Area } from '../../../../lib/types'

// SF-2052 — every area must carry a mode before activation.
export function validateModeConfig(areas: Area[]): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  if (areas.some((a) => a.mode === undefined)) issues.push('unassigned-mode')
  return { valid: issues.length === 0, issues }
}
