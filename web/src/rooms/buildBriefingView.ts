import type { BriefingInputs } from '../../../core/lib/types'
import type { BriefingView } from '../types'

// SF-5083 — render the E6 briefing (AF-602 output). Each row names a pseudonymised
// cluster + area, never a person or an original (C1, NG-21). The estimate is a "≈"
// range carrying its formula note (Handoff rule 12). No person column (NG-13).
export function buildBriefingView(inputs: BriefingInputs): BriefingView {
  const rows = inputs.findings.map((f) => ({
    observation: `${f.theme} (${f.area})`, // pseudonymised cluster + area — never a person
    scope: `${f.clusterSize} Anfragen`,
    artefact: f.artefact,
  }))
  const low = inputs.findings.reduce((a, f) => a + f.hoursSavedLow, 0)
  const high = inputs.findings.reduce((a, f) => a + f.hoursSavedHigh, 0)
  return {
    week: inputs.week,
    people: inputs.people,
    rows,
    estimate: { low, high, approx: true, noteKey: 'briefing.estimate_note' },
    hasPersonColumn: false,
  }
}
