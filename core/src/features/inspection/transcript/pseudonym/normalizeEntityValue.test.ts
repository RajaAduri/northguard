import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { normalizeEntityValue } from './normalizeEntityValue'

describe('SF-3051 normalizeEntityValue — unit rules', () => {
  it('1. legal forms + case fold to one form', () => {
    const forms = ['Brechtmann GmbH', 'Brechtmann', 'Brechtmann GmbH & Co. KG', 'brechtmann gmbh']
    const n = forms.map((f) => normalizeEntityValue(f, 'supplier'))
    expect(new Set(n).size).toBe(1)
    expect(n[0]).toBe('brechtmann')
  })
  it('2. umlaut/transliteration folds (Müller ≡ Mueller)', () => {
    expect(normalizeEntityValue('Müller Präzisionstechnik AG', 'supplier')).toBe(
      normalizeEntityValue('Mueller Praezisionstechnik AG', 'supplier'),
    )
  })
  it('3. declension on a legal form (GmbHs) folds to the base', () => {
    expect(normalizeEntityValue('Brechtmann GmbHs', 'supplier')).toBe(normalizeEntityValue('Brechtmann GmbH', 'supplier'))
  })
  it('4. distinct suppliers sharing a first token stay distinct (no over-collapse)', () => {
    expect(normalizeEntityValue('Brechtmann', 'supplier')).not.toBe(normalizeEntityValue('Brechtmann Metallbau', 'supplier'))
  })
})

// NG-18 acceptance gate: the maintained corpus. Every group → one pseudonym; no
// cross-group collision. THIS IS THE HARD GATE — a red here is a defect, never tuned away.
describe('SF-3051 — de-entity-variants corpus (FR-24, NG-18)', () => {
  const corpus = parse(readFileSync(join(process.cwd(), '..', 'lexicons', 'de-entity-variants.yml'), 'utf8')) as {
    groups: { id: string; kind: string; forms: string[] }[]
    distinct: [string, string][]
  }

  for (const g of corpus.groups) {
    it(`group ${g.id}: all forms collapse to one`, () => {
      const norms = g.forms.map((f) => normalizeEntityValue(f, g.kind))
      expect(new Set(norms).size, `forms mapped to: ${JSON.stringify(norms)}`).toBe(1)
    })
  }

  for (const [a, b] of corpus.distinct) {
    it(`distinct: "${a}" ≠ "${b}"`, () => {
      expect(normalizeEntityValue(a)).not.toBe(normalizeEntityValue(b))
    })
  }
})
