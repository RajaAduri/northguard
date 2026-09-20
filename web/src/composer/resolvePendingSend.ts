import type { Verdict } from '../types'

// SF-5014 — Send pressed during typing auto-sends on a clean verdict, but STOPS on a
// finding (redact/block) — never auto-send a touch (Handoff §1.1).
export function resolvePendingSend(pending: boolean, verdict: Verdict): 'auto-send' | 'stop' {
  return pending && verdict === 'clean' ? 'auto-send' : 'stop'
}
