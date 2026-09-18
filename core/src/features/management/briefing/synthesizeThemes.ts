import type { BriefingInputs, Theme } from '../../../../lib/types'

// SF-6022 — the recurring-work themes. Deterministic over the E7 findings (same inputs
// → same themes, FR-13); the top few by cluster size, each naming the artefact that
// would end the repetition. Empty findings → no themes (the Sprint-4 partial state,
// completed once E7 AF-706 lands in Sprint 5). Non-attributable — topics, never people (NG-21).
export function synthesizeThemes(inp: BriefingInputs): Theme[] {
  return [...inp.findings]
    .sort((a, b) => b.clusterSize - a.clusterSize || a.theme.localeCompare(b.theme))
    .slice(0, 4)
    .map((f) => {
      const theme: Theme = {
        title: f.theme,
        signal: `${f.clusterSize} Anfragen im Bereich ${f.area}${f.cadence ? ` (${f.cadence})` : ''}`,
      }
      if (f.artefact) theme.artefact = f.artefact
      return theme
    })
}
