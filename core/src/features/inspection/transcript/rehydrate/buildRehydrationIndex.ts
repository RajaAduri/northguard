import type { PlaceholderMapping, RehydrationIndex } from '../../../../../lib/types'

// SF-3071 — index the client-held mapping by placeholder + a declension stem (the
// inner head word), so an inflected form can be matched later. Pure; owns nothing (NG-14).
export function buildRehydrationIndex(mapping: PlaceholderMapping): RehydrationIndex {
  const entries = Object.entries(mapping).map(([placeholder, original]) => {
    const core = placeholder.replace(/[⟨⟩]/g, '').trim() // "Lieferant 1"
    const word = core.split(/\s+/)[0] ?? core // "Lieferant"
    return { placeholder, original, word, stem: word.toLowerCase() }
  })
  return { entries }
}
