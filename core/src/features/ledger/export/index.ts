// AF-405 — Evidence export bundle (US-017). CSV + JSONL over a range, with a
// re-verifiable chain (AF-406) and a SHA-256 bundle checksum. Pseudonyms only
// (FR-25); no key material (NG-17); no plaintext user id (NG-19); the export is
// itself logged (NG-12).
import type { KeyMaterial } from '../../../../lib/types'
import { projectSafeFields } from '../query'
import { collectRange } from './collectRange'
import { buildCsv } from './buildCsv'
import { buildJsonl } from './buildJsonl'
import { computeBundleChecksum, formatChecksum } from './computeBundleChecksum'
import { assertExportPrivacy } from './assertExportPrivacy'
import { writeExportGovernanceEvent } from './writeExportGovernanceEvent'

export { collectRange } from './collectRange'
export { buildCsv } from './buildCsv'
export { buildJsonl } from './buildJsonl'
export { computeBundleChecksum, formatChecksum } from './computeBundleChecksum'
export { assertExportPrivacy, ExportPrivacyError } from './assertExportPrivacy'
export { writeExportGovernanceEvent } from './writeExportGovernanceEvent'

export interface EvidenceBundle {
  csv: string
  jsonl: string
  checksum: string
  header: string
  governanceId: string
}

export async function exportEvidenceBundle(
  from: string,
  to: string,
  reason: string,
  actor: string,
  key: KeyMaterial,
): Promise<EvidenceBundle> {
  const entries = projectSafeFields(await collectRange(from, to), 'export')
  const csv = buildCsv(entries)
  const jsonl = buildJsonl(entries)
  assertExportPrivacy(csv, jsonl) // gate BEFORE emit
  const checksum = computeBundleChecksum(csv, jsonl)
  const governanceId = await writeExportGovernanceEvent({ from, to }, reason, actor, checksum, key)
  return { csv, jsonl, checksum, header: formatChecksum(checksum), governanceId }
}
