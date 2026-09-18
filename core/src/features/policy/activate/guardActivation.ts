import type { Area, StabilityReport } from '../../../../lib/types'
import { validateAreaSet } from '../confirm/validateAreaSet'
import { validateModeConfig } from '../modes/validateModeConfig'

export type ActivationBlockReason = 'unstable' | 'invalid-areas' | 'unassigned-mode'

export class ActivationBlockedError extends Error {
  readonly reason: ActivationBlockReason
  constructor(reason: ActivationBlockReason) {
    super(`NG-3: activation blocked — ${reason}`)
    this.name = 'ActivationBlockedError'
    this.reason = reason
  }
}

// SF-2061 — the activation guard. There is no force path (NG-3). Order: stability,
// then a valid area set, then every area has a mode.
export function guardActivation(areas: Area[], stability: StabilityReport): void {
  if (stability.stable !== true) throw new ActivationBlockedError('unstable')
  if (!validateAreaSet(areas).valid) throw new ActivationBlockedError('invalid-areas')
  if (!validateModeConfig(areas).valid) throw new ActivationBlockedError('unassigned-mode')
}
