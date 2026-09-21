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
//
// Amendment B (§9 F1): stability gates only the INITIAL baseline (requireStability=true,
// the onboarding convergence must have converged). A later baseline from an approved
// Änderungsantrag does not re-extract, so it carries no stability check — the caller
// passes requireStability=false. The measurement is kept, not deleted (NG-22).
export function guardActivation(areas: Area[], stability: StabilityReport, requireStability = true): void {
  if (requireStability && stability.stable !== true) throw new ActivationBlockedError('unstable')
  if (!validateAreaSet(areas).valid) throw new ActivationBlockedError('invalid-areas')
  if (!validateModeConfig(areas).valid) throw new ActivationBlockedError('unassigned-mode')
}
