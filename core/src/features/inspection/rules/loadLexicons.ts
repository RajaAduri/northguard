import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import type { Lexicons, LexEntry, RuleFamily } from '../../../../lib/types'

export class LexiconLoadError extends Error {
  constructor(message: string) {
    super(`lexicon load failed: ${message}`)
    this.name = 'LexiconLoadError'
  }
}

interface RawLexFile {
  entries?: { id: string; canonical: string; area: string; variants: string[] }[]
  rule_families?: { id: string; area: string; label_de: string; label_en: string }[]
}

// SF-3011 — load + validate all lexicon YAML in `dir` once at boot. Bilingual DE/EN
// lives in the variant lists (NG-16). Missing files or duplicate ids fail fast.
export function loadLexicons(dir: string): Lexicons {
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
  } catch {
    throw new LexiconLoadError(`directory not readable: ${dir}`)
  }
  if (files.length === 0) throw new LexiconLoadError(`no lexicon files in ${dir}`)

  const entries: LexEntry[] = []
  const ruleFamilies: RuleFamily[] = []
  const seenEntry = new Set<string>()
  const seenRule = new Set<string>()

  for (const file of files) {
    const doc = parse(readFileSync(join(dir, file), 'utf8')) as RawLexFile
    for (const e of doc.entries ?? []) {
      if (seenEntry.has(e.id)) throw new LexiconLoadError(`duplicate entry id: ${e.id}`)
      seenEntry.add(e.id)
      entries.push({ id: e.id, canonical: e.canonical, area: e.area, variants: e.variants })
    }
    for (const r of doc.rule_families ?? []) {
      if (seenRule.has(r.id)) throw new LexiconLoadError(`duplicate rule id: ${r.id}`)
      seenRule.add(r.id)
      ruleFamilies.push({ id: r.id, area: r.area, labelDe: r.label_de, labelEn: r.label_en })
    }
  }
  return { entries, ruleFamilies }
}
