import type { LedgerEntry } from '../../../../lib/types'

const RAW_TEXT_FIELDS = ['promptText', 'responseText', 'rawPrompt', 'rawResponse', 'text', 'content']

// SF-4043 — project the fields permitted in a context. Management (NG-13): the actor
// dimension is dropped entirely — no actorPseudonym, no person column. Export (NG-19):
// actorPseudonym is kept (a stable audit token) but never a plaintext id. Raw text is
// never present in either.
export function projectSafeFields(entries: LedgerEntry[], ctx: 'management' | 'export'): LedgerEntry[] {
  return entries.map((e) => {
    const clone: Record<string, unknown> = { ...e }
    for (const f of RAW_TEXT_FIELDS) delete clone[f]
    delete clone['user'] // never a plaintext id, in any context (NG-19)
    if (ctx === 'management') {
      delete clone['actorPseudonym']
      delete clone['actorEpoch']
    }
    return clone as unknown as LedgerEntry
  })
}
