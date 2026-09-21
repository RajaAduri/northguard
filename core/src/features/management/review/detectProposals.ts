import type { Baseline, LedgerEntry, Proposal, ReviewContext } from '../../../../lib/types'

const MODE_MISMATCH_MIN_REPORTS = 3

// SF-6092 — detect proposals from the accumulated evidence (the business-event records,
// NG-23). Each proposal states numeric evidence + period; never a bare recommendation.
// Reads one store (no parallel E7 store). Deterministic. May find nothing.
export function detectProposals(window: LedgerEntry[], profile: Baseline, ctx: ReviewContext): Proposal[] {
  const proposals: Proposal[] = []
  const touched = new Set(window.flatMap((e) => e.touchedAreas ?? []))

  // dormant area — a profile area with no hits over the window (states both readings)
  for (const area of profile.areas) {
    if (!touched.has(area.id)) {
      proposals.push({
        kind: 'dormant-area', areaRef: area.id,
        evidence: { metric: 'hits', count: 0, period: ctx.period },
        businessValue: `Bereich „${area.label}“ ohne Treffer — entweder ungenutzt oder die Erkennung greift nicht; beide Lesarten sind nützlich.`,
        priority: 3,
      })
    }
  }
  // mode mismatch — a block-mode area with recurring FP reports → propose redact
  for (const r of ctx.fpReports ?? []) {
    if (r.count >= MODE_MISMATCH_MIN_REPORTS && profile.areas.find((a) => a.id === r.area)?.mode === 'block') {
      proposals.push({
        kind: 'mode-mismatch', areaRef: r.area,
        evidence: { metric: 'false-positive reports', count: r.count, period: ctx.period },
        businessValue: `Bereich blockiert und erzeugt ${r.count} Fehlalarme — Maskieren vorschlagen.`,
        priority: 1,
      })
    }
  }
  // synonym / abbreviation extension — highest value in DE engineering
  for (const t of ctx.unrecognisedTerms ?? []) {
    proposals.push({
      kind: 'synonym',
      evidence: { metric: `occurrences of "${t.term}"`, count: t.count, period: ctx.period },
      businessValue: `Kürzel „${t.term}“ wiederholt im Verkehr, von keinem Bereich erkannt — als Synonym ergänzen.`,
      priority: 1,
    })
  }
  // coverage gap — repeated prompts touching a concept no area covers
  for (const g of ctx.uncoveredTopics ?? []) {
    proposals.push({
      kind: 'coverage-gap',
      evidence: { metric: `prompts on "${g.topic}"`, count: g.count, period: ctx.period },
      businessValue: `Wiederholte Anfragen zu „${g.topic}“, von keinem Bereich abgedeckt.`,
      priority: 2,
    })
  }
  // new business activity — a pseudonym in traffic the profile has never seen
  const known = new Set(ctx.knownPseudonyms ?? [])
  const seen = new Set<string>()
  for (const e of window) for (const s of e.spanPseudonyms ?? []) {
    if (!known.has(s.pseudonym) && !seen.has(s.pseudonym)) {
      seen.add(s.pseudonym)
      proposals.push({
        kind: 'new-activity', areaRef: s.area,
        evidence: { metric: 'new entity', count: 1, period: ctx.period },
        businessValue: 'Eine Entität taucht auf, die das Profil noch nie gesehen hat — das Profil bemerkt, dass sich das Geschäft geändert hat.',
        priority: 2,
      })
    }
  }
  return proposals
}
