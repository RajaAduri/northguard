// AF-602 — Weekly briefing (US-020, PARTIAL). Structure + ledger stats now; the E7
// recurring-work themes complete in Sprint 5 once AF-706 lands (findings injected).
// Inputs are deterministic; the letter is regenerable (FR-13).
import type { BriefingInputs, RecurringWorkFinding } from '../../../../lib/types'
import { gatherBriefingInputs } from './gatherBriefingInputs'
import { synthesizeThemes } from './synthesizeThemes'
import { synthesizeFriction } from './synthesizeFriction'
import { assessPolicyFit } from './assessPolicyFit'
import { buildBriefingFootnote } from './buildBriefingFootnote'
import { renderBriefingMarkdown } from './renderBriefingMarkdown'

export { gatherBriefingInputs } from './gatherBriefingInputs'
export { synthesizeThemes } from './synthesizeThemes'
export { synthesizeFriction } from './synthesizeFriction'
export { assessPolicyFit } from './assessPolicyFit'
export { buildBriefingFootnote } from './buildBriefingFootnote'
export { renderBriefingMarkdown } from './renderBriefingMarkdown'

export async function composeWeeklyBriefing(
  from: string,
  to: string,
  week: string,
  people: number,
  findings: RecurringWorkFinding[] = [], // Sprint 5: E7 AF-706 output
): Promise<{ inputs: BriefingInputs; markdown: string }> {
  const inputs = await gatherBriefingInputs(from, to, week, people, findings)
  const markdown = renderBriefingMarkdown(
    { week, people },
    synthesizeThemes(inputs),
    synthesizeFriction(inputs),
    assessPolicyFit(inputs),
    buildBriefingFootnote(inputs),
  )
  return { inputs, markdown }
}
