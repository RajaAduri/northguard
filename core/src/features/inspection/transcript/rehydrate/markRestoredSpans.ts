import type { MatchResult, RestoredSpan } from '../../../../../lib/types'

// SF-3073 — substitute matched placeholders with their originals, left-to-right,
// recording each restored span's position in the restored text (FR-08h — the caller
// marks them as locally restored and derives an "N values inserted locally" balance).
// Display-only: this text is never re-sent upstream (NG-1, enforced by the caller).
export function markRestoredSpans(
  text: string,
  match: MatchResult,
): { restoredText: string; restoredSpans: RestoredSpan[] } {
  const ordered = [...match.matches].sort((a, b) => a.offset - b.offset)
  let restoredText = ''
  let cursor = 0
  const restoredSpans: RestoredSpan[] = []
  for (const m of ordered) {
    if (m.offset < cursor) continue // skip overlaps defensively
    restoredText += text.slice(cursor, m.offset)
    const start = restoredText.length
    restoredText += m.original
    restoredSpans.push({ placeholder: m.placeholder, original: m.original, offset: start, length: m.original.length })
    cursor = m.offset + m.length
  }
  restoredText += text.slice(cursor)
  return { restoredText, restoredSpans }
}
