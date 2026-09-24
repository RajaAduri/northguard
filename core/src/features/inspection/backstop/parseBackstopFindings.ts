// A raw model finding: the area id + the EXACT substring the model flagged. LLMs cannot
// produce reliable character offsets, so the model returns the text; anchorBackstopFindings
// locates it in the prompt (SF-3025b). `offset`/`length` from the model, if any, are ignored.
export interface RawLlmFinding {
  area: string
  value: string
}

// SF-3025 — parse the model completion (fenced or plain JSON). Malformed → throws, which
// the caller treats as inconclusive and records reduced coverage (NG-4/NG-24). Entries
// without a non-empty area + value are dropped.
export function parseBackstopFindings(raw: string): RawLlmFinding[] {
  const stripped = raw.replace(/```(?:json)?/gi, '').trim()
  const parsed = JSON.parse(stripped) as { findings?: { area?: unknown; value?: unknown }[] }
  const findings = parsed.findings ?? []
  return findings
    .filter((f): f is { area: string; value: string } => typeof f.area === 'string' && typeof f.value === 'string' && f.value.length > 0)
    .map((f) => ({ area: f.area, value: f.value }))
}
