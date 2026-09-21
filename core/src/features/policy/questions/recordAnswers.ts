import type { WorkingSet } from '../../../../lib/types'

// SF-2083 — fold answers into the working set as provenance (an auditor sees why an
// area is defined the way it is). Answers never activate anything (NG-22).
export function recordAnswers(working: WorkingSet, answers: { q: string; a: string }[]): WorkingSet {
  return { areas: working.areas, answers: [...(working.answers ?? []), ...answers] }
}
