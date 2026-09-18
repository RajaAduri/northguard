import type { WireMessage } from '../../../../../lib/types'

export class WireLeakError extends Error {
  constructor(original: string) {
    super(`NG-1: an original value leaked into the wire transcript: "${original}"`)
    this.name = 'WireLeakError'
  }
}

// SF-3062 — the two-transcript invariant (NG-1). The wire transcript is the ONLY
// content transmitted upstream, including as history; no original value may appear in
// any wire message. Cheap enough to call at runtime, not only in tests.
export function assertWireIsolation(wire: WireMessage[], originals: string[]): void {
  for (const original of originals) {
    if (original.length === 0) continue
    for (const msg of wire) {
      if (msg.content.includes(original)) throw new WireLeakError(original)
    }
  }
}
