import type { Area, ConfirmationModel } from '../../../../lib/types'
import { validateAreaSet } from './validateAreaSet'

// SF-2041 — the pure confirmation model the UI applies. Every area is editable and
// unconfirmed; editing never activates (NG-3). Validity comes from validateAreaSet.
export function buildAreaConfirmationModel(areas: Area[]): ConfirmationModel {
  const prepared = areas.map((a) => ({ ...a, confirmed: false }))
  const { valid, issues } = validateAreaSet(prepared)
  return { areas: prepared, valid, issues }
}
