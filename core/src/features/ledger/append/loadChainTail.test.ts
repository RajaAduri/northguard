import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadChainTail, GENESIS_HASH } from './loadChainTail'

let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-tail-'))
  path = join(dir, 'ledger.jsonl')
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-4011 loadChainTail', () => {
  it('1. existing ledger returns last entry hash + count', () => {
    writeFileSync(
      path,
      [
        JSON.stringify({ id: '1', hash: 'h1' }),
        JSON.stringify({ id: '2', hash: 'h2' }),
      ].join('\n') + '\n',
    )
    expect(loadChainTail(path)).toEqual({ lastHash: 'h2', count: 2 })
  })

  it('2. no ledger returns genesis hash + 0', () => {
    expect(loadChainTail(path)).toEqual({ lastHash: GENESIS_HASH, count: 0 })
  })

  it('3. a truncated last line (crash mid-write) is ignored, returns prior tail', () => {
    writeFileSync(
      path,
      JSON.stringify({ id: '1', hash: 'h1' }) + '\n' + '{"id":"2","ha', // torn
    )
    expect(loadChainTail(path)).toEqual({ lastHash: 'h1', count: 1 })
  })
})
