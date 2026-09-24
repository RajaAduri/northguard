// AF-302 — LLM backstop + graceful degradation (US-007). Never fails open (NG-4).
import type { ActivePolicy, BackstopResult } from '../../../../lib/types'
import { backstopAvailabilityGuard } from './backstopAvailabilityGuard'
import { shouldInvokeBackstop } from './shouldInvokeBackstop'
import { buildBackstopPrompt } from './buildBackstopPrompt'
import { callBackstopModel } from './callBackstopModel'
import { parseBackstopFindings } from './parseBackstopFindings'
import { anchorBackstopFindings } from './anchorBackstopFindings'

export { backstopAvailabilityGuard } from './backstopAvailabilityGuard'
export { shouldInvokeBackstop } from './shouldInvokeBackstop'
export { buildBackstopPrompt } from './buildBackstopPrompt'
export { callBackstopModel, BackstopUnavailableError } from './callBackstopModel'
export { parseBackstopFindings } from './parseBackstopFindings'
export { anchorBackstopFindings } from './anchorBackstopFindings'

export async function runBackstop(input: {
  prompt: string
  policy: ActivePolicy
}): Promise<BackstopResult> {
  // No model-relevant area configured → the model layer isn't part of this policy;
  // 'full' is honest (there is nothing for the model to inspect). NG-24.
  if (!shouldInvokeBackstop(input.policy)) return { findings: [], coverage: 'full' }

  // NG-24 (NG-2 applied to coverage): the model layer IS configured, so 'full' is only
  // honest if it actually runs to completion. Unavailable → rules-only, never full.
  if (!(await backstopAvailabilityGuard())) return { findings: [], coverage: 'rules-only' }

  try {
    const raw = await callBackstopModel(buildBackstopPrompt(input.prompt, input.policy))
    const findings = anchorBackstopFindings(input.prompt, parseBackstopFindings(raw))
    return { findings, coverage: 'full' } // the model ran to completion
  } catch {
    return { findings: [], coverage: 'rules-only' } // model error / malformed → inconclusive, recorded
  }
}
