import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadLexicons, LexiconLoadError } from './loadLexicons'

let dir: string
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ng-lex-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

const yml = `version: "1.0.0"
entries:
  - id: LEX-1
    canonical: "Lieferanten & Konditionen"
    area: lieferanten-konditionen
    variants: ["Lieferant", "supplier"]
rule_families:
  - id: RULE-EMAIL
    label_de: "E-Mail-Adresse"
    label_en: "email address"
    area: kundendaten
`

describe('SF-3011 loadLexicons', () => {
  it('1. valid yml returns merged, indexed lexicons', () => {
    writeFileSync(join(dir, 'protected-areas-de.yml'), yml)
    const lex = loadLexicons(dir)
    expect(lex.entries[0]?.area).toBe('lieferanten-konditionen')
    expect(lex.ruleFamilies[0]?.id).toBe('RULE-EMAIL')
  })

  it('2. a directory with no lexicon file throws LexiconLoadError', () => {
    expect(() => loadLexicons(dir)).toThrow(LexiconLoadError)
  })

  it('3. duplicate entry ids throw (stable ids required)', () => {
    writeFileSync(join(dir, 'a.yml'), yml)
    writeFileSync(join(dir, 'b.yml'), yml) // same LEX-1 id
    expect(() => loadLexicons(dir)).toThrow(LexiconLoadError)
  })

  it('4. loads the real project lexicon (DE+EN bilingual, NG-16)', () => {
    const lex = loadLexicons(join(process.cwd(), '..', 'lexicons'))
    expect(lex.entries.length).toBeGreaterThanOrEqual(6)
    expect(lex.entries.some((e) => e.variants.includes('supplier'))).toBe(true)
  })
})
