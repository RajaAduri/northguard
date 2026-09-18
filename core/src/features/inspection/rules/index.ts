// AF-301 — Rules layer (US-006). Runs first, always; deterministic; no network (NG-7).
import type { ActivePolicy, Lexicons, Locale, RuleHit } from '../../../../lib/types'
import { loadLexicons } from './loadLexicons'
import { matchRulePatterns } from './matchRulePatterns'
import { matchLexiconTerms } from './matchLexiconTerms'
import { mapHitsToAreas } from './mapHitsToAreas'

export { loadLexicons, LexiconLoadError } from './loadLexicons'
export { matchRulePatterns } from './matchRulePatterns'
export { matchLexiconTerms } from './matchLexiconTerms'
export { mapHitsToAreas } from './mapHitsToAreas'

// Lexicons are loaded once at boot (never per request — hot path stays allocation-light).
let lexicons: Lexicons | null = null
export function configureLexicons(lex: Lexicons): void {
  lexicons = lex
}
export function loadRulesLayer(dir: string): void {
  lexicons = loadLexicons(dir)
}

// AF-301 entry: rules → parallel-then-converge → active areas.
export function runRulesLayer(input: { prompt: string; policy: ActivePolicy; locale: Locale }): RuleHit[] {
  if (!lexicons) throw new Error('rules layer not initialised: call loadRulesLayer(dir) or configureLexicons(lex) at boot')
  const raw = [
    ...matchRulePatterns(input.prompt),
    ...matchLexiconTerms(input.prompt, lexicons, input.locale),
  ]
  return mapHitsToAreas(raw, input.policy)
}
