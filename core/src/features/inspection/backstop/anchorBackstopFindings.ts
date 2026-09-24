import type { LlmFinding } from '../../../../lib/types'
import type { RawLlmFinding } from './parseBackstopFindings'

// SF-3025b — anchor value-based model findings to the prompt. The model returns the
// exact substring it flagged; we locate EVERY occurrence in the prompt and emit a span
// per occurrence. A value that is not a verbatim substring is DROPPED, never
// approximately placed (NG-9: never guess a location). This makes redaction correct even
// when a weak local model cannot count characters.
export function anchorBackstopFindings(prompt: string, raw: RawLlmFinding[]): LlmFinding[] {
  const out: LlmFinding[] = []
  const seen = new Set<string>()
  for (const f of raw) {
    let from = 0
    for (;;) {
      const idx = prompt.indexOf(f.value, from)
      if (idx === -1) break
      const kdedup = `${idx}:${f.value.length}`
      if (!seen.has(kdedup)) {
        seen.add(kdedup)
        out.push({ area: f.area, offset: idx, length: f.value.length, value: f.value, layer: 'llm' })
      }
      from = idx + Math.max(1, f.value.length)
    }
  }
  return out
}
