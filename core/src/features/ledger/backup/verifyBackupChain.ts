import { recomputeChain } from '../verify'

// SF-4072 — verify a snapshot's chain by delegating to AF-406. A truncated or
// tampered snapshot fails; a restored ledger that continues the chain passes (NFR-06).
export async function verifyBackupChain(target: string): Promise<boolean> {
  const { ok } = await recomputeChain(target)
  return ok
}
