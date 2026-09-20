import type { Locale } from '../types'

// SF-5052 — the UI language follows the person (per-user). German is the default. A
// change affects UI copy only — NOT area/rule names, which follow the policy (rule 11).
export function resolveUiLocale(userPref: Locale | null): Locale {
  return userPref ?? 'de'
}
