import type { PlaceholderMapping, RedactionSpan } from '../types'

// SF-5036 — build the client-side placeholder→original mapping from the original prompt and
// the verdict spans. Held in the browser only and never sent (NG-14); it is what the local
// rehydration engine reverses. Extracted from App so it is tested, not inline.
export function buildClientMapping(original: string, spans: RedactionSpan[]): PlaceholderMapping {
  const mapping: PlaceholderMapping = {}
  for (const s of spans) mapping[s.placeholder] = original.slice(s.offset, s.offset + s.length)
  return mapping
}
