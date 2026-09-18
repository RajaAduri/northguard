import type { Locale, MatchResult, RehydrationIndex, RehydrationMatch } from '../../../../../lib/types'

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function overlaps(matches: RehydrationMatch[], offset: number, length: number): boolean {
  return matches.some((m) => offset < m.offset + m.length && m.offset < offset + length)
}

// SF-3072 — match placeholders in the provider text. Exact placeholders always match.
// An inflected inner word (German declension) matches ONLY when its stem is
// unambiguous (maps to exactly one original) — never guess (NG-9): an ambiguous or
// paraphrased placeholder is left for collectUnresolved. Pure (NG-14).
export function matchPlaceholderTokens(text: string, idx: RehydrationIndex, _locale: Locale): MatchResult {
  const matches: RehydrationMatch[] = []
  const stemCount = new Map<string, number>()
  for (const e of idx.entries) stemCount.set(e.stem, (stemCount.get(e.stem) ?? 0) + 1)

  // 1. exact placeholder occurrences (handles ⟨Lieferant 1⟩ vs ⟨Lieferant 2⟩)
  for (const e of idx.entries) {
    let i = text.indexOf(e.placeholder)
    while (i !== -1) {
      if (!overlaps(matches, i, e.placeholder.length)) {
        matches.push({ placeholder: e.placeholder, original: e.original, offset: i, length: e.placeholder.length })
      }
      i = text.indexOf(e.placeholder, i + 1)
    }
  }

  // 2. confident-stem declension (only when the stem is unambiguous)
  for (const e of idx.entries) {
    if (stemCount.get(e.stem) !== 1) continue // ambiguous → never guess
    const re = new RegExp(`(?<![\\p{L}])⟨?${escapeRegex(e.word)}(?:s|es|en|e|n|em|er)?⟩?(?![\\p{L}])`, 'giu')
    for (const m of text.matchAll(re)) {
      if (m.index === undefined) continue
      if (overlaps(matches, m.index, m[0].length)) continue
      matches.push({ placeholder: e.placeholder, original: e.original, offset: m.index, length: m[0].length })
    }
  }

  matches.sort((a, b) => a.offset - b.offset)
  return { matches, text }
}
