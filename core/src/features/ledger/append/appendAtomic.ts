import { open } from 'node:fs/promises'

// Per-path single-writer lock: serialises concurrent appends so the chain is never
// interleaved or corrupted.
const locks = new Map<string, Promise<void>>()

async function writeOne(path: string, line: string): Promise<void> {
  const handle = await open(path, 'a')
  try {
    await handle.appendFile(line + '\n', 'utf8')
    await handle.sync() // fsync: durable before we resolve (NG-5, NFR-06)
  } finally {
    await handle.close()
  }
}

// SF-4013 — atomic, fsync'd, single-writer append.
export async function appendAtomic(path: string, line: string): Promise<void> {
  const prior = locks.get(path) ?? Promise.resolve()
  const next = prior.then(
    () => writeOne(path, line),
    () => writeOne(path, line), // a prior failure must not block later writers
  )
  // Keep the chain alive but never let a rejection become unhandled.
  locks.set(
    path,
    next.then(
      () => undefined,
      () => undefined,
    ),
  )
  return next
}
