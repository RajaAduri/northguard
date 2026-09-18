import type { Authorisation, RoleBinding } from '../../../../lib/types'

export class DualAuthorisationError extends Error {
  constructor(message: string) {
    super(`NG-20: ${message}`)
    this.name = 'DualAuthorisationError'
  }
}

// SF-4082 — the Vier-Augen-Prinzip. Requires exactly two named parties in DISTINCT
// bound roles (IT security + works-council representative); neither can unmask alone.
export function verifyDualAuthorisation(
  auths: Authorisation[],
  roleBinding: RoleBinding,
): { party: string; role: string }[] {
  if (auths.length !== 2) throw new DualAuthorisationError('exactly two authorisers are required')
  const [a, b] = auths as [Authorisation, Authorisation]
  if (a.party.trim() === '' || b.party.trim() === '') throw new DualAuthorisationError('each authoriser must be named')
  if (a.role === b.role) throw new DualAuthorisationError('the two authorisers must hold distinct roles')
  const roles = new Set([a.role, b.role])
  if (!roles.has(roleBinding.itSecurityRole) || !roles.has(roleBinding.worksCouncilRole)) {
    throw new DualAuthorisationError('the pair must be IT security + a works-council representative')
  }
  return [
    { party: a.party, role: a.role },
    { party: b.party, role: b.role },
  ]
}
