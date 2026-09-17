import { randomUUID } from 'node:crypto'
import type { LedgerEntry } from '../../../../lib/types'
import { loadChainTail } from './loadChainTail'
import { computeEntryHash } from './computeEntryHash'
import { appendAtomic } from './appendAtomic'
import { assertNoPlaintextActor } from './assertNoPlaintextActor'

// The ledger file lives on customer infra. Resolved from env, overridable in tests.
let ledgerPath: string =
  process.env.NORTHGUARD_LEDGER_PATH ?? 'northguard-ledger.jsonl'

export function setLedgerPath(path: string): void {
  ledgerPath = path
}

// SF-4014 — compose: guard (NG-19) → chain → hash → atomic append.
export async function appendLedgerEntry(
  e: Partial<LedgerEntry>,
): Promise<{ id: string; hash: string }> {
  assertNoPlaintextActor(e as Record<string, unknown>) // NG-19: before any write

  const { lastHash } = loadChainTail(ledgerPath)
  const withoutHash = {
    ...e,
    id: e.id ?? randomUUID(),
    ts: e.ts ?? new Date().toISOString(),
    prevHash: lastHash,
  }
  const hash = computeEntryHash(withoutHash, lastHash)
  const entry = { ...withoutHash, hash }

  await appendAtomic(ledgerPath, JSON.stringify(entry)) // throws on write failure (NG-5)
  return { id: entry.id, hash }
}
