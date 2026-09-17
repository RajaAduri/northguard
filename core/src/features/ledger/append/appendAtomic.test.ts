import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { appendAtomic } from './appendAtomic'

let dir: string
let path: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-atomic-'))
  path = join(dir, 'ledger.jsonl')
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('SF-4013 appendAtomic', () => {
  it('1. a line is appended and durable before resolve', async () => {
    await appendAtomic(path, '{"id":"1"}')
    expect(readFileSync(path, 'utf8')).toBe('{"id":"1"}\n')
  })

  it('2. a second append is present alongside the first (no gap after restart)', async () => {
    await appendAtomic(path, 'a')
    await appendAtomic(path, 'b')
    expect(readFileSync(path, 'utf8')).toBe('a\nb\n')
  })

  it('3. concurrent appends are serialised (all present, no corruption)', async () => {
    const lines = Array.from({ length: 50 }, (_, i) => `line${i}`)
    await Promise.all(lines.map((l) => appendAtomic(path, l)))
    const written = readFileSync(path, 'utf8').trim().split('\n').sort()
    expect(written).toEqual([...lines].sort())
    expect(written).toHaveLength(50)
  })
})
