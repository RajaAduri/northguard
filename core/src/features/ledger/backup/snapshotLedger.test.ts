import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { snapshotLedger, KeyMaterialInBackupError } from './snapshotLedger'
import { appendLedgerEntry, setLedgerPath } from '../append'

let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-snap-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-4071 snapshotLedger', () => {
  it('1. a consistent snapshot is written to target with the entry count', async () => {
    await appendLedgerEntry({ kind: 'request', actorPseudonym: 'a1', actorEpoch: 1 })
    await appendLedgerEntry({ kind: 'request', actorPseudonym: 'a2', actorEpoch: 1 })
    const target = join(dir, 'backup.jsonl')
    const r = await snapshotLedger(target)
    expect(r.count).toBe(2)
    expect(readFileSync(target, 'utf8')).toBe(readFileSync(path, 'utf8'))
  })

  it('2. a torn last line in the source is not carried as a valid entry in the count', async () => {
    await appendLedgerEntry({ kind: 'request', actorPseudonym: 'a1', actorEpoch: 1 })
    writeFileSync(path, readFileSync(path, 'utf8') + '{"id":"torn","ha') // crash mid-write
    const r = await snapshotLedger(join(dir, 'backup.jsonl'))
    expect(r.count).toBe(1) // clean chain boundary
  })

  it('3. an unwritable target throws (backup never silently skipped)', async () => {
    await appendLedgerEntry({ kind: 'request', actorPseudonym: 'a1', actorEpoch: 1 })
    await expect(snapshotLedger(join(dir, 'no-such-dir', 'backup.jsonl'))).rejects.toThrow()
  })

  it('4. NG-17: key material in the ledger is refused for the backup', async () => {
    // Should never happen (NG-19 guards writes), but the backup asserts it too.
    writeFileSync(path, JSON.stringify({ id: '1', hash: 'h', secret: 'customer-key' }) + '\n')
    await expect(snapshotLedger(join(dir, 'backup.jsonl'))).rejects.toThrow(KeyMaterialInBackupError)
  })
})
