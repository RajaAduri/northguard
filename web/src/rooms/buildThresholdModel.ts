import type { ThresholdView } from '../types'

// SF-5081 — the named, dated threshold between the two rooms. States that aggregation
// is structural (no names — NG-13); the enter action is one word; the way back is a
// header word (rendered by the shell).
export function buildThresholdModel(week: string, people: number): ThresholdView {
  return {
    kickerKey: 'threshold.kicker',
    headlineKey: 'threshold.headline',
    bodyKey: 'threshold.body',
    enterKey: 'threshold.enter',
    week,
    people,
  }
}
