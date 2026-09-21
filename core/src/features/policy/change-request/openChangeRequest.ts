import { randomUUID } from 'node:crypto'
import type { Area, ChangeRequest, KeyMaterial } from '../../../../lib/types'
import { writeGovernanceEvent } from '../../ledger/governance'

// SF-2101 — open an Änderungsantrag: the only path to a new baseline (NG-22). Records a
// govKind:'change-request' event (requester pseudonymised, NG-19); the session it was
// raised in is stamped so approval can enforce "separated in time".
export async function openChangeRequest(
  areas: Area[],
  requester: string,
  requestSession: string,
  rationale: string,
  key: KeyMaterial,
): Promise<ChangeRequest> {
  if (rationale.trim().length === 0) throw new Error('NG-12: a change request requires a rationale')
  const cr: ChangeRequest = {
    id: `CR-${randomUUID().slice(0, 8)}`,
    requester,
    requestSession,
    requestedAt: new Date().toISOString(),
    areas: areas.map((a) => ({ ...a })),
    rationale,
    status: 'open',
  }
  await writeGovernanceEvent('change-request', requester, rationale, {
    changeRequestId: cr.id,
    session: requestSession,
    areaCount: cr.areas.length,
  }, key)
  return cr
}
