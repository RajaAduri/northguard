import type { LlmFinding } from '../../../../lib/types'

interface RawFinding {
  area: string
  offset: number
  length: number
  value: string
  confidence?: number
}

// SF-3025 — parse the model completion (fenced or plain JSON). Malformed → throws,
// which the caller treats as inconclusive and records reduced coverage (NG-4).
export function parseBackstopFindings(raw: string): LlmFinding[] {
  const stripped = raw.replace(/```(?:json)?/gi, '').trim()
  const parsed = JSON.parse(stripped) as { findings?: RawFinding[] }
  const findings = parsed.findings ?? []
  return findings.map((f) => {
    const out: LlmFinding = { area: f.area, offset: f.offset, length: f.length, value: f.value, layer: 'llm' }
    if (typeof f.confidence === 'number') out.confidence = f.confidence
    return out
  })
}
