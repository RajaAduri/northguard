// SF-3051 — German entity-value normalisation (NG-18). Folds legal forms,
// umlaut/transliteration, casing, "Fa." prefix and "& Söhne" ("and sons") suffix so
// one entity yields one pseudonym — WITHOUT collapsing distinct entities that merely
// share a first token. Deliberately does NOT reduce a name to its first token (that
// would over-collapse "Nordwerk Immobilien" into "Nordwerk").

const UMLAUTS: [RegExp, string][] = [
  [/ä/g, 'ae'],
  [/ö/g, 'oe'],
  [/ü/g, 'ue'],
  [/ß/g, 'ss'],
]

// Trailing legal-form / company-suffix tokens, stripped repeatedly from the end.
const LEGAL_SUFFIX =
  /(\s*&?\s*(gmbh|ag|kg|mbh|e\.?\s?k\.?|gbr|ohg|se|co\.?|kgaa|ug)s?\.?)+$/i

// "& Söhne" / "und Söhne" ("and sons") — a company-name suffix, not a distinguishing token.
const AND_SONS = /\s*(&|und)\s*soehne$/i

const TITLE_PREFIX = /^(frau|herr|hr\.|fr\.)\s+/i

export function normalizeEntityValue(value: string, type = ''): string {
  let s = value.normalize('NFC').toLowerCase().trim()
  for (const [re, rep] of UMLAUTS) s = s.replace(re, rep)
  s = s.replace(/\s+und\s+/g, ' & ') // "und Söhne" → "& soehne"
  s = s.replace(/^fa\.?\s+/i, '') // "Fa. Brechtmann" → "Brechtmann"

  if (type.toLowerCase() === 'person') {
    s = s.replace(TITLE_PREFIX, '') // drop Frau/Herr
    const tokens = s.replace(/[.,]/g, '').split(/\s+/).filter(Boolean)
    return tokens[tokens.length - 1] ?? s // resolve on the surname (A. Berger ≡ Anna Berger ≡ Frau Berger)
  }

  // Strip company suffixes repeatedly until stable.
  let prev = ''
  while (prev !== s) {
    prev = s
    s = s.replace(AND_SONS, '')
    s = s.replace(LEGAL_SUFFIX, '')
    s = s.trim()
  }
  return s.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim()
}
