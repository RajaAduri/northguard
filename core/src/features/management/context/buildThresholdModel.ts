import type { ThresholdModel } from '../../../../lib/types'

// SF-6062 — the named, dated threshold ("Schwelle") between the two rooms. It states
// that aggregation is structural (no names, no per-request attribution — NG-13); the
// way back is a word in the header, not a tab.
export function buildThresholdModel(week: string, people: number): ThresholdModel {
  return {
    week,
    people,
    headline: 'Sie verlassen Ihre Arbeitsfläche und sehen die Woche des Teams.',
    aggregationNote: `Zusammengefasst über ${people} Personen. Keine Namen, keine Zuordnung einzelner Anfragen — das ist strukturell so gebaut, nicht ausgeblendet.`,
    structural: true,
    enterLabel: 'Woche ansehen',
    backInHeader: true,
  }
}
