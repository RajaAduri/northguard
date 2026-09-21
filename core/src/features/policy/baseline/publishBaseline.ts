import type { Baseline, KeyMaterial } from '../../../../lib/types'
import { writeGovernanceEvent } from '../../ledger/governance'
import { _setActiveBaseline, getActiveBaseline } from './getActiveBaseline'

// SF-2092 — publish a baseline (F4: supersedes the built publishActivePolicy). A
// supersede writes a govKind:'baseline' governance event (NG-22); the prior version
// stays readable. The active baseline is never mutated in place — publishing always
// installs a NEW immutable version.
export async function publishBaseline(b: Baseline, key: KeyMaterial): Promise<void> {
  const prev = getActiveBaseline()
  await writeGovernanceEvent(
    'baseline',
    b.approver,
    `baseline ${b.version} (basis: ${b.basis})`,
    { version: b.version, basis: b.basis, changeRequestId: b.changeRequestId, checksum: b.checksum, supersedes: prev?.version ?? null },
    key,
  )
  _setActiveBaseline(b)
}
