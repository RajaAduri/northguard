import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { collectRange } from './collectRange'
import { appendLedgerEntry, setLedgerPath } from '../append'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-export-'))
  setLedgerPath(join(dir, 'ledger.jsonl'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-4051 collectRange', () => {
  it('1. returns all entries within the range (requests + governance)', async () => {
    await appendLedgerEntry({ kind: 'request', ts: '2026-09-10T00:00:00Z', actorPseudonym: 'a', actorEpoch: 1 })
    await appendLedgerEntry({ kind: 'governance', ts: '2026-09-11T00:00:00Z', govKind: 'export', actorPseudonym: 'b', actorEpoch: 1 })
    const out = await collectRange('2026-09-01T00:00:00Z', '2026-09-30T00:00:00Z')
    expect(out).toHaveLength(2)
  })
  it('2. an empty range → a valid empty set', async () => {
    await appendLedgerEntry({ kind: 'request', ts: '2026-01-01T00:00:00Z', actorPseudonym: 'a', actorEpoch: 1 })
    expect(await collectRange('2026-09-01T00:00:00Z', '2026-09-30T00:00:00Z')).toEqual([])
  })
})
