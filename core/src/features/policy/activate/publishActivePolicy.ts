import type { ActivePolicy } from '../../../../lib/types'

// The single live enforcement path. No active policy → inspection refuses to forward
// (fresh-install lock).
let active: ActivePolicy | null = null

// SF-2063 — publish a guarded, logged activation; a superseding activation retires
// the prior version.
export function publishActivePolicy(p: ActivePolicy): void {
  active = p
}

export function getActivePolicy(): ActivePolicy | null {
  return active
}

export function resetActivePolicy(): void {
  active = null
}
