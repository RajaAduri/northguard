import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

// SF-5098 — the structural gate that would have caught the Sprint 6 AND Sprint 9 bypasses:
// a tested component that nothing renders is not done. This fails if any src component
// (*.tsx) is referenced only by test files — i.e. green in isolation but never mounted.
// "Rendered" = its name appears in an import in some non-test, non-barrel source file (a
// barrel index.ts only re-exports, so it does not count as a use).
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY_POINTS = ['main.tsx', 'states.tsx'] // mount roots, not components imported elsewhere

function walk(dir: string): string[] {
  const out: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p)
  }
  return out
}

const isTest = (f: string): boolean => /\.test\.(ts|tsx)$/.test(f)
const isBarrel = (f: string): boolean => basename(f) === 'index.ts'

describe('SF-5098 orphan-component gate', () => {
  it('every component is rendered by non-test code (no test-only components)', () => {
    const files = walk(SRC)
    const nonTestSources = files.filter((f) => !isTest(f))
    const components = files.filter((f) => f.endsWith('.tsx') && !isTest(f) && !ENTRY_POINTS.includes(basename(f)))

    const orphans = components.filter((component) => {
      const name = basename(component).replace(/\.tsx$/, '')
      const importRe = new RegExp(`import[^\\n]*\\b${name}\\b`)
      return !nonTestSources.some((f) => f !== component && !isBarrel(f) && importRe.test(readFileSync(f, 'utf8')))
    })

    expect(orphans.map((f) => basename(f))).toEqual([])
  })
})
