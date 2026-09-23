import type { WireMessage } from '../../../../../lib/types'

export class WireLeakError extends Error {
  constructor(original: string) {
    super(`NG-1: an original value leaked into the wire transcript: "${original}"`)
    this.name = 'WireLeakError'
  }
}

// Semantic placeholders (⟨Lieferant⟩, ⟨Preis⟩, ⟨Marge 2⟩ …) are a closed, generic
// category vocabulary (SF-3041/3042); they never embed a customer value. A label may
// therefore coincidentally share a word with a protected original that IS a common
// German noun (e.g. "Marge", "Preis"). That is not a leak — the confidential value was
// still replaced. So the check ignores text inside placeholder delimiters and looks for
// originals only in the bare wire text.
const PLACEHOLDER = /⟨[^⟩]*⟩/g

// SF-3062 — the two-transcript invariant (NG-1). The wire transcript is the ONLY
// content transmitted upstream, including as history; no original value may appear in
// any wire message OUTSIDE a placeholder. Cheap enough to call at runtime, not only in tests.
export function assertWireIsolation(wire: WireMessage[], originals: string[]): void {
  for (const original of originals) {
    if (original.length === 0) continue
    for (const msg of wire) {
      const bare = msg.content.replace(PLACEHOLDER, ' ')
      if (bare.includes(original)) throw new WireLeakError(original)
    }
  }
}
