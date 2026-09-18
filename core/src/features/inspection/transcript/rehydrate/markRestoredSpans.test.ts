import { describe, it, expect } from 'vitest'
import { markRestoredSpans } from './markRestoredSpans'
import type { MatchResult } from '../../../../../lib/types'

describe('SF-3073 markRestoredSpans', () => {
  it('1. originals substituted; each restored span flagged', () => {
    const text = 'Angebot von ⟨Lieferant⟩ heute'
    const match: MatchResult = { text, matches: [{ placeholder: '⟨Lieferant⟩', original: 'Brechtmann GmbH', offset: 12, length: 11 }] }
    const { restoredText, restoredSpans } = markRestoredSpans(text, match)
    expect(restoredText).toBe('Angebot von Brechtmann GmbH heute')
    expect(restoredSpans[0]).toMatchObject({ placeholder: '⟨Lieferant⟩', original: 'Brechtmann GmbH' })
    expect(restoredText.slice(restoredSpans[0]!.offset, restoredSpans[0]!.offset + restoredSpans[0]!.length)).toBe('Brechtmann GmbH')
  })
  it('2. the "N values inserted locally" balance derives from restoredSpans.length', () => {
    const text = '⟨Lieferant 1⟩ und ⟨Lieferant 2⟩'
    const match: MatchResult = {
      text,
      matches: [
        { placeholder: '⟨Lieferant 1⟩', original: 'ACME', offset: 0, length: 13 },
        { placeholder: '⟨Lieferant 2⟩', original: 'BETA', offset: 18, length: 13 },
      ],
    }
    expect(markRestoredSpans(text, match).restoredSpans).toHaveLength(2)
  })
  it('3. with no matches the text is unchanged', () => {
    const text = 'nichts hier'
    expect(markRestoredSpans(text, { text, matches: [] }).restoredText).toBe('nichts hier')
  })
})
