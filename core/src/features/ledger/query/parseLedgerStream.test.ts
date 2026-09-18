import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { parseLedgerStream, ChainError } from './parseLedgerStream'

let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-query-'))
  path = join(dir, 'ledger.jsonl')
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

async function collect(p: string) {
  const out = []
  for await (const e of parseLedgerStream(p)) out.push(e)
  return out
}

describe('SF-4041 parseLedgerStream', () => {
  it('1. streams entries without a full load', async () => {
    writeFileSync(path, [JSON.stringify({ id: '1', hash: 'h1' }), JSON.stringify({ id: '2', hash: 'h2' })].join('\n') + '\n')
    const out = await collect(path)
    expect(out.map((e) => e.id)).toEqual(['1', '2'])
  })
  it('2. a malformed line throws ChainError (never skipped)', async () => {
    writeFileSync(path, JSON.stringify({ id: '1', hash: 'h' }) + '\n' + '{bad json}\n')
    await expect(collect(path)).rejects.toThrow(ChainError)
  })
  it('3. an empty/missing ledger yields nothing', async () => {
    expect(await collect(path)).toEqual([])
  })
})
