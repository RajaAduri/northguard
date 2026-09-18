import type { LedgerEntry } from '../../../../lib/types'

export class RawTextInLedgerError extends Error {
  constructor(field: string) {
    super(`NG-10: raw prompt/response text ("${field}") must not reach the ledger in default mode`)
    this.name = 'RawTextInLedgerError'
  }
}

// Fields that would carry raw prompt/response text — forbidden unless full-text
// retention is opted in per deployment (never the default).
const RAW_TEXT_FIELDS = ['promptText', 'responseText', 'rawPrompt', 'rawResponse', 'text', 'content']

// SF-4022 — the last guard before an append: assert the entry carries pseudonyms +
// metadata only, no raw text (NG-10). Full-text opt-in is off by default.
export function redactBeforeWrite(
  entry: Partial<LedgerEntry>,
  opts: { fullTextOptIn?: boolean } = {},
): Partial<LedgerEntry> {
  if (opts.fullTextOptIn) return entry
  const record = entry as Record<string, unknown>
  for (const field of RAW_TEXT_FIELDS) {
    if (record[field] !== undefined && record[field] !== null) throw new RawTextInLedgerError(field)
  }
  return entry
}
