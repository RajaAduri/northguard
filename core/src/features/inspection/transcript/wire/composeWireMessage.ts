import type { WireMessage } from '../../../../../lib/types'

// SF-3061 — append this turn's redacted wire text to the (already-redacted) history.
// Pure: prior turns are never re-hydrated; returns a fresh array (NG-1, NG-14).
export function composeWireMessage(history: WireMessage[], wireText: string): WireMessage[] {
  return [...history, { role: 'user', content: wireText }]
}
