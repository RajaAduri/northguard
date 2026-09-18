import type { Lexicons, Locale, RawHit } from '../../../../lib/types'

// SF-3013 — bilingual longest-match over lexicon variants. Both DE and EN variants
// are candidates (NG-16); the longest non-overlapping match wins, residual retained.
export function matchLexiconTerms(text: string, lex: Lexicons, _locale: Locale): RawHit[] {
  const hay = text.toLowerCase()
  const candidates: RawHit[] = []
  for (const entry of lex.entries) {
    for (const variant of entry.variants) {
      const needle = variant.toLowerCase()
      let from = 0
      let idx = hay.indexOf(needle, from)
      while (idx !== -1) {
        candidates.push({ offset: idx, length: variant.length, value: text.slice(idx, idx + variant.length), area: entry.area })
        from = idx + 1
        idx = hay.indexOf(needle, from)
      }
    }
  }
  // Longest first so a longer variant claims the span over a shorter overlapping one.
  candidates.sort((a, b) => b.length - a.length || a.offset - b.offset)
  const accepted: RawHit[] = []
  for (const c of candidates) {
    const overlaps = accepted.some((a) => c.offset < a.offset + a.length && a.offset < c.offset + c.length)
    if (!overlaps) accepted.push(c)
  }
  return accepted.sort((a, b) => a.offset - b.offset)
}
