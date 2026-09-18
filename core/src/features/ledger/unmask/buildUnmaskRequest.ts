import type { UnmaskRequest } from '../../../../lib/types'

// SF-4081 — a well-formed unmask request. A missing reason throws (an unmask must
// state its Anlass — NG-12/NG-20); a target that is not pseudonym-shaped throws
// (guards against passing a raw id in by mistake).
export function buildUnmaskRequest(targetPseudonym: string, reason: string): UnmaskRequest {
  if (reason.trim().length === 0) throw new Error('an unmask must state its reason (NG-20)')
  if (!/^[0-9a-f]{64}$/.test(targetPseudonym)) throw new Error('target is not a pseudonym (expected a 64-hex token)')
  return { targetPseudonym, reason }
}
