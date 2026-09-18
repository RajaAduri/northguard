import type { ExportRequest } from '../../../../lib/types'

// SF-6051 — a management export must have a range and state its Anlass (reason).
export function validateExportRequest(req: ExportRequest): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  if (req.reason.trim().length === 0) issues.push('missing-reason')
  if (req.from > req.to) issues.push('inverted-range')
  return { valid: issues.length === 0, issues }
}
