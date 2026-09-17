import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { verifyBackupChain } from './verifyBackupChain'
import { snapshotLedger } from './snapshotLedger'
import { recomputeChain } from '../verify'
import { appendLedgerEntry, setLedgerPath } from '../append'

let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-verbak-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

async function seed(n: number): Promise<void> {
  for (let i = 0; i < n; i++) await appendLedgerEntry({ kind: 'request', actorPseudonym: `a${i}`, actorEpoch: 1 })
}

describe('SF-4072 verifyBackupChain', () => {
  it('1. a good snapshot verifies (delegates AF-406)', async () => {
    await seed(5)
    const target = join(dir, 'backup.jsonl')
    await snapshotLedger(target)
    expect(await verifyBackupChain(target)).toBe(true)
  })

  it('2. a truncated snapshot returns false', async () => {
    await seed(3)
    const target = join(dir, 'backup.jsonl')
    await snapshotLedger(target)
    const lines = readFileSync(target, 'utf8').trim().split('\n')
    lines[1] = (lines[1] as string).slice(0, 20) // corrupt/truncate a middle line
    writeFileSync(target, lines.join('\n') + '\n')
    expect(await verifyBackupChain(target)).toBe(false)
  })

  it('3. a restored ledger continues the chain with no gap (NFR-06)', async () => {
    await seed(3)
    const target = join(dir, 'backup.jsonl')
    await snapshotLedger(target)
    // restore: point the writer at the snapshot and continue
    setLedgerPath(target)
    await appendLedgerEntry({ kind: 'request', actorPseudonym: 'a-restored', actorEpoch: 1 })
    expect(await verifyBackupChain(target)).toBe(true)
    expect(await recomputeChain(target)).toEqual({ ok: true })
  })
})
