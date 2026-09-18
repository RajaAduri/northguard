import type { ExportRequest, KeyMaterial } from '../../../../lib/types'
import { exportEvidenceBundle, type EvidenceBundle } from '../../ledger/export'
import { validateExportRequest } from './validateExportRequest'

// SF-6052 — delegate to E4 AF-405. The request is validated (Anlass mandatory) and the
// export is logged as a governance event. The bundle carries actorPseudonym (audit),
// never a plaintext user id (NG-19); the management view itself has no person column
// (NG-13). Note: `key` is required for AF-405's pseudonymised export governance event.
export async function invokeExport(req: ExportRequest, actor: string, key: KeyMaterial): Promise<EvidenceBundle> {
  const { valid, issues } = validateExportRequest(req)
  if (!valid) throw new Error(`invalid export request: ${issues.join(', ')}`)
  return exportEvidenceBundle(req.from, req.to, req.reason, actor, key)
}
