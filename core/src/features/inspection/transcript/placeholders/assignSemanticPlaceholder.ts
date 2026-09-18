const OPAQUE = new Set(['REDACTED', '[REDACTED]', 'XXX', '***'])

// SF-3042 — a semantic, indexed placeholder. index 0 → bare ⟨Type⟩; index ≥ 1 →
// ⟨Type N⟩ (used when a type has colliding entities). Opaque/empty tokens are
// forbidden (NG-11).
export function assignSemanticPlaceholder(type: string, index: number): string {
  const t = type.trim()
  if (t.length === 0 || OPAQUE.has(t.toUpperCase())) {
    throw new Error(`NG-11: opaque placeholder forbidden for type "${type}"`)
  }
  return index === 0 ? `⟨${t}⟩` : `⟨${t} ${index}⟩`
}
