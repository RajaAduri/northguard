import type { Baseline, ChangeRequest, KeyMaterial, TenantPolicySettings } from '../../../../lib/types'
import { normalizeActorId } from '../../../../lib/pseudonym'
import { buildBaseline, publishBaseline, getActiveBaseline } from '../baseline'

const SELF_APPROVED_NOTE = 'beantragt und freigegeben von derselben Person'
const DEFAULT_SETTINGS: TenantPolicySettings = { fourEyes: false }

// SF-2102 — approve an Änderungsantrag and cut the new baseline (NG-22). The Amendment B
// decision: the same person may request AND approve (recorded, shown in the version
// history), UNLESS the tenant has four-eyes on; and a self-approval may NEVER occur in
// the same session as the request (separated in time). On success the change request is
// the basis for a new immutable baseline.
export async function approveChangeRequest(
  cr: ChangeRequest,
  approver: string,
  approverSession: string,
  key: KeyMaterial,
  settings: TenantPolicySettings = DEFAULT_SETTINGS,
): Promise<Baseline> {
  if (cr.status !== 'open') throw new Error(`change request ${cr.id} is not open`)
  const selfApproved = normalizeActorId(approver) === normalizeActorId(cr.requester)
  if (selfApproved && settings.fourEyes) {
    throw new Error('Vier-Augen-Prinzip: der Antragsteller darf denselben Antrag nicht freigeben')
  }
  if (selfApproved && approverSession === cr.requestSession) {
    throw new Error('Selbstfreigabe darf nicht in derselben Sitzung wie der Antrag erfolgen (zeitlich getrennt)')
  }
  const built = buildBaseline(cr.areas, approver, cr.id, getActiveBaseline() ?? undefined)
  const baseline: Baseline = {
    ...built,
    ...(selfApproved ? { selfApproved: true, approvalNote: SELF_APPROVED_NOTE } : {}),
  }
  cr.status = 'approved'
  await publishBaseline(baseline, key)
  return baseline
}
