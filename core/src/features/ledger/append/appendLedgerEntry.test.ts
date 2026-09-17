import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { appendLedgerEntry, setLedgerPath } from './appendLedgerEntry'
import { PlaintextActorError } from './assertNoPlaintextActor'

let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-append-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-4014 appendLedgerEntry', () => {
  it('1. prevHash is chained, id + hash are returned', async () => {
    const r = await appendLedgerEntry({ kind: 'request', actorPseudonym: 'a1', actorEpoch: 1 })
    expect(r.id).toBeTruthy()
    expect(r.hash).toMatch(/^[0-9a-f]{64}$/)
    const line = JSON.parse(readFileSync(path, 'utf8').trim())
    expect(line.hash).toBe(r.hash)
    expect(line.prevHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('2. the second entry.prevHash === the first entry.hash', async () => {
    const first = await appendLedgerEntry({ kind: 'request', actorPseudonym: 'a1', actorEpoch: 1 })
    const second = await appendLedgerEntry({ kind: 'request', actorPseudonym: 'a2', actorEpoch: 1 })
    const [l1, l2] = readFileSync(path, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    expect(l1.hash).toBe(first.hash)
    expect(l2.prevHash).toBe(first.hash)
    expect(l2.hash).toBe(second.hash)
  })

  it('3. a write failure throws (caller must not proceed to reply — NG-5)', async () => {
    setLedgerPath(join(dir, 'does-not-exist-dir', 'ledger.jsonl'))
    await expect(
      appendLedgerEntry({ kind: 'request', actorPseudonym: 'a1', actorEpoch: 1 }),
    ).rejects.toThrow()
  })

  it('4. an entry with a plaintext user id is rejected before any write (NG-19)', async () => {
    await expect(
      appendLedgerEntry({ kind: 'request', user: 'anna.berger' } as never),
    ).rejects.toThrow(PlaintextActorError)
    // nothing was written
    expect(() => readFileSync(path, 'utf8')).toThrow()
  })
})
