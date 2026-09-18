import type { FpResolution, GovKind, KeyMaterial } from '../../../../lib/types'
import { writeGovernanceEvent } from '../../ledger/governance'

const KIND: Record<FpResolution['kind'], GovKind> = {
  narrow: 'rule-narrow',
  exclude: 'term-exclude',
  'mode-change': 'mode-change',
  dismiss: 'dismiss',
}

// SF-6044 — every resolution is a governance event (NG-12): actor + reason + payload,
// written to the ledger. dismiss requires a reason (enforced by the writer). Note:
// `key` is required because the governance actor is pseudonymised (NG-19).
export async function applyResolution(action: FpResolution, actor: string, key: KeyMaterial): Promise<string> {
  const payload: Record<string, unknown> = { ...action }
  return writeGovernanceEvent(KIND[action.kind], actor, action.reason, payload, key)
}
