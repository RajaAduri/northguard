// AF-302 — LLM backstop + graceful degradation (US-007). Never fails open (NG-4).
import type { ActivePolicy, BackstopResult, RuleHit } from '../../../../lib/types'
import { backstopAvailabilityGuard } from './backstopAvailabilityGuard'
import { shouldInvokeBackstop } from './shouldInvokeBackstop'
import { buildBackstopPrompt } from './buildBackstopPrompt'
import { callBackstopModel } from './callBackstopModel'
import { parseBackstopFindings } from './parseBackstopFindings'

export { backstopAvailabilityGuard } from './backstopAvailabilityGuard'
export { shouldInvokeBackstop } from './shouldInvokeBackstop'
export { buildBackstopPrompt } from './buildBackstopPrompt'
export { callBackstopModel, BackstopUnavailableError } from './callBackstopModel'
export { parseBackstopFindings } from './parseBackstopFindings'

export async function runBackstop(input: {
  prompt: string
  ruleHits: RuleHit[]
  policy: ActivePolicy
}): Promise<BackstopResult> {
  // Not worth invoking (rules conclusive or trivial prompt) → full coverage, no findings.
  if (!shouldInvokeBackstop(input.prompt, input.ruleHits)) return { findings: [], coverage: 'full' }

  // Unreachable → degrade to rules-only; the caller records it (NG-4). Never fail open.
  if (!(await backstopAvailabilityGuard())) return { findings: [], coverage: 'rules-only' }

  try {
    const raw = await callBackstopModel(buildBackstopPrompt(input.prompt, input.policy))
    return { findings: parseBackstopFindings(raw), coverage: 'full' }
  } catch {
    return { findings: [], coverage: 'rules-only' } // model error / malformed → inconclusive, recorded
  }
}
