import type { Baseline } from '../../../../lib/types'

// The live baseline + full history. An active baseline is immutable (NG-22); prior
// versions remain readable (history is evidence).
let active: Baseline | null = null
const history = new Map<string, Baseline>()

export function _setActiveBaseline(b: Baseline): void {
  active = b
  history.set(b.version, b)
}

// SF-2093 — the active profile; prior versions retrievable by version.
export function getActiveBaseline(): Baseline | null {
  return active
}

export function getBaseline(version: string): Baseline | null {
  return history.get(version) ?? null
}

export function resetBaselines(): void {
  active = null
  history.clear()
}
