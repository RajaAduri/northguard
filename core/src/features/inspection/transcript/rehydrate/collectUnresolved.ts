import type { MatchResult } from '../../../../../lib/types'

// SF-3074 — any placeholder still visible after restoration is unresolved (never
// silently dropped, never guessed — NG-9). Scans the restored text for remaining
// ⟨…⟩ tokens.
export function collectUnresolved(restoredText: string, _match: MatchResult): string[] {
  const unresolved: string[] = []
  for (const m of restoredText.matchAll(/⟨[^⟩]*⟩/g)) unresolved.push(m[0])
  return unresolved
}
