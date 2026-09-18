// AF-307 — Rehydration engine (US-012). Pure, client-side; the mapping is injected
// and owned by no one here (NG-14). Never guesses (NG-9); restored content is
// display-only and never re-enters the wire (NG-1).
import type { Locale, PlaceholderMapping, RehydrateResult } from '../../../../../lib/types'
import { buildRehydrationIndex } from './buildRehydrationIndex'
import { matchPlaceholderTokens } from './matchPlaceholderTokens'
import { markRestoredSpans } from './markRestoredSpans'
import { collectUnresolved } from './collectUnresolved'

export { buildRehydrationIndex } from './buildRehydrationIndex'
export { matchPlaceholderTokens } from './matchPlaceholderTokens'
export { markRestoredSpans } from './markRestoredSpans'
export { collectUnresolved } from './collectUnresolved'

export function rehydrateReply(input: {
  providerText: string
  mapping: PlaceholderMapping
  locale: Locale
}): RehydrateResult {
  const index = buildRehydrationIndex(input.mapping)
  const match = matchPlaceholderTokens(input.providerText, index, input.locale)
  const { restoredText, restoredSpans } = markRestoredSpans(input.providerText, match)
  const unresolved = collectUnresolved(restoredText, match)
  return { restoredText, restoredSpans, unresolved }
}
