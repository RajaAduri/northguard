import type { Ambiguity, ClarifyingQuestion } from '../../../../lib/types'

const MAX_QUESTIONS = 8 // hard budget 5–8 (onboarding < ~20 min)

// SF-2082 — concrete questions from the ambiguities extraction actually hit (never a
// fixed questionnaire). Capped at 8, highest-value first. Answerable by a quality lead
// alone.
export function generateClarifyingQuestions(ambiguities: Ambiguity[]): ClarifyingQuestion[] {
  return ambiguities.slice(0, MAX_QUESTIONS).map((a, i) => ({
    id: `Q${i + 1}`,
    text: a.question,
    areaRef: a.areaId,
    source: 'ambiguity',
  }))
}
