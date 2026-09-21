import { describe, it, expect } from 'vitest'
import { detectAmbiguities } from './detectAmbiguities'
import { generateClarifyingQuestions } from './generateClarifyingQuestions'
import { recordAnswers } from './recordAnswers'
import type { Ambiguity, Area, WorkingSet } from '../../../../lib/types'

const ws = (ids: string[]): WorkingSet => ({ areas: ids.map((id): Area => ({ id, label: id, confirmed: false })) })

describe('SF-2081 detectAmbiguities', () => {
  it('raises a boundary question for an ambiguous area; clean set → []', () => {
    expect(detectAmbiguities(ws(['kundendaten']))[0]?.kind).toBe('boundary')
    expect(detectAmbiguities(ws(['projektcodenamen']))).toEqual([]) // no boundary ambiguity
  })
})

describe('SF-2082 generateClarifyingQuestions', () => {
  it('concrete questions from real ambiguities, capped at 8', () => {
    const many: Ambiguity[] = Array.from({ length: 12 }, (_, i) => ({ areaId: `a${i}`, kind: 'boundary', question: `q${i}?` }))
    const qs = generateClarifyingQuestions(many)
    expect(qs.length).toBe(8)
    expect(qs[0]?.source).toBe('ambiguity')
  })
  it('few ambiguities → few questions (not padded)', () => {
    expect(generateClarifyingQuestions([{ areaId: 'kundendaten', kind: 'boundary', question: 'q?' }])).toHaveLength(1)
  })
})

describe('SF-2083 recordAnswers', () => {
  it('folds answers in as provenance; never activates', () => {
    const out = recordAnswers(ws(['kundendaten']), [{ q: 'q?', a: 'ja' }])
    expect(out.answers).toEqual([{ q: 'q?', a: 'ja' }])
    expect(out.areas).toHaveLength(1)
  })
})
