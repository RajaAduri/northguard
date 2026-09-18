import type { LedgerEntry } from '../../../../lib/types'
import { appendLedgerEntry } from '../append'

// SF-4084 — the unmask is itself a ledger entry (NG-20): both authorising parties,
// the reason, and the target pseudonym. It records NO recovered identity and NO
// plaintext user id (NG-19). The authoriser names are the accountability record of
// who performed the unmask (that is the point of the Vier-Augen log).
export async function writeUnmaskGovernanceEvent(
  target: string,
  authorisers: { party: string; role: string }[],
  reason: string,
  _key: unknown,
): Promise<string> {
  const entry: Partial<LedgerEntry> = {
    kind: 'governance',
    govKind: 'unmask',
    reason,
    unmaskTarget: target,
    unmaskAuthorisers: authorisers,
  }
  const { id } = await appendLedgerEntry(entry)
  return id
}
