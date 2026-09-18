import type { KeyMaterial } from '../../../../lib/types'
import { writeGovernanceEvent } from '../governance'

// SF-4055 — the export is itself a logged governance event (NG-12): actor, reason,
// range, checksum. A missing reason throws (an export must state its Anlass). Note:
// `key` is required because the actor is pseudonymised (NG-19).
export async function writeExportGovernanceEvent(
  range: { from: string; to: string },
  reason: string,
  actor: string,
  checksum: string,
  key: KeyMaterial,
): Promise<string> {
  if (reason.trim().length === 0) throw new Error('an export must state its Anlass (reason)')
  return writeGovernanceEvent('export', actor, reason, { range, checksum }, key)
}
