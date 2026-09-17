import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { recomputeChain } from './recomputeChain'
import { appendLedgerEntry, setLedgerPath } from '../append'

let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-verify-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

async function seed(n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    await appendLedgerEntry({ kind: 'request', actorPseudonym: `a${i}`, actorEpoch: 1 })
  }
}

describe('SF-4061 recomputeChain (AF-406)', () => {
  it('1. an intact ledger verifies ok', async () => {
    await seed(5)
    expect(await recomputeChain(path)).toEqual({ ok: true })
  })

  it('2. a tampered entry is detected with its index', async () => {
    await seed(3)
    const lines = readFileSync(path, 'utf8').trim().split('\n')
    const tampered = JSON.parse(lines[1] as string)
    tampered.actorPseudonym = 'HACKED'
    lines[1] = JSON.stringify(tampered)
    writeFileSync(path, lines.join('\n') + '\n')
    const r = await recomputeChain(path)
    expect(r.ok).toBe(false)
    expect(r.brokenAt).toBe(1)
  })

  it('3. a month of entries (30) completes and confirms unbroken (§8 test)', async () => {
    await seed(30)
    expect(await recomputeChain(path)).toEqual({ ok: true })
  })

  it('3b. an empty/missing ledger is trivially ok', async () => {
    expect(await recomputeChain(path)).toEqual({ ok: true })
  })

  it('3c. a broken prevHash link is detected', async () => {
    await seed(2)
    const lines = readFileSync(path, 'utf8').trim().split('\n')
    const e = JSON.parse(lines[1] as string)
    e.prevHash = 'f'.repeat(64) // wrong link, hash left stale
    lines[1] = JSON.stringify(e)
    writeFileSync(path, lines.join('\n') + '\n')
    const r = await recomputeChain(path)
    expect(r.ok).toBe(false)
    expect(r.brokenAt).toBe(1)
  })
})
