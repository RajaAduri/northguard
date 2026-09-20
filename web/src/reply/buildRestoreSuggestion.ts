import type { PlaceholderMapping, RestoreSuggestion } from '../types'

// SF-5033 — for an unresolved placeholder, offer a suggestion with an explicit
// insert/leave choice. The value is NEVER inserted automatically (NG-9): applying it is
// a deliberate user action; leaving it keeps the placeholder visible.
export function buildRestoreSuggestion(unresolved: string, mapping: PlaceholderMapping): RestoreSuggestion {
  return {
    placeholder: unresolved,
    suggestion: mapping[unresolved] ?? null, // shown, never auto-applied
    applyKey: 'restore.apply',
    keepKey: 'restore.keep',
  }
}
