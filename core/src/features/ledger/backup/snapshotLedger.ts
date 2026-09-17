import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { getLedgerPath, loadChainTail } from '../append'

export class KeyMaterialInBackupError extends Error {
  constructor() {
    super('NG-17: key material must never appear in a ledger backup')
    this.name = 'KeyMaterialInBackupError'
  }
}

// Keys/preimages that must never be present in a ledger snapshot (NG-17).
const FORBIDDEN_KEY_FIELDS = /"(secret|customerKey|keyMaterial|privateKey)"\s*:/i

// SF-4071 — a consistent snapshot of the ledger to `target`. The pseudonym key
// store is NEVER included (NG-17) — asserted, not assumed. Throws if the target is
// unwritable (a backup is never silently skipped).
export async function snapshotLedger(target: string): Promise<{ path: string; count: number }> {
  const source = getLedgerPath()
  const content = existsSync(source) ? readFileSync(source, 'utf8') : ''
  if (FORBIDDEN_KEY_FIELDS.test(content)) throw new KeyMaterialInBackupError()
  // count only whole, valid entries — a torn last line is a clean boundary, not an entry
  const { count } = loadChainTail(source)
  writeFileSync(target, content) // throws if the target directory is unwritable/missing
  return { path: target, count }
}
