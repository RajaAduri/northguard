import type { RawHit } from '../../../../lib/types'

// §8 A4: rules are precision-first (a latency/determinism strategy); contextual
// recall is the model's job (AF-302). This is a bounded, validated set — not an
// open-ended pattern zoo. All patterns are linear-time (no catastrophic backtracking).

const PRICE_TERM =
  /(rabatt|marge|margen|zielmarge|preis|preise|aufschlag|deckungsbeitrag|price|pricing|margin|discount|markup)/i

function pushUnique(hits: RawHit[], hit: RawHit): void {
  if (!hits.some((h) => h.offset === hit.offset && h.length === hit.length && h.ruleId === hit.ruleId)) {
    hits.push(hit)
  }
}

function scan(text: string, re: RegExp, ruleId: string, area: string, hits: RawHit[]): void {
  for (const m of text.matchAll(re)) {
    if (m.index === undefined) continue
    pushUnique(hits, { offset: m.index, length: m[0].length, value: m[0], ruleId, area })
  }
}

function sentenceAround(text: string, index: number): string {
  const start = Math.max(text.lastIndexOf('.', index), text.lastIndexOf('\n', index)) + 1
  let end = text.indexOf('.', index)
  if (end === -1) end = text.length
  return text.slice(start, end)
}

// SF-3012 — validated regex families incl. German identifiers.
export function matchRulePatterns(text: string): RawHit[] {
  const hits: RawHit[] = []

  scan(text, /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]+/g, 'RULE-EMAIL', 'kundendaten', hits)
  scan(text, /\b(?:CN|CT|VN)-\d{3,}\b/g, 'RULE-CONTRACT', 'kundendaten', hits)
  scan(text, /\b[A-Za-z][A-Za-z0-9]*-(?:core|internal|prod|api|svc)\b/g, 'RULE-REPO', 'quellcode-repositories', hits)
  scan(text, /\b\d{2,3}\/\d{3}\/\d{4,5}\b/g, 'RULE-STEUERNUMMER', 'kundendaten', hits)
  scan(text, /\bHR[AB]\s?\d{1,6}\b/g, 'RULE-HRN', 'kundendaten', hits)

  // Percentage only counts with a price term in the same sentence (narrowed form).
  for (const m of text.matchAll(/\d+(?:[.,]\d+)?\s*%/g)) {
    if (m.index === undefined) continue
    if (PRICE_TERM.test(sentenceAround(text, m.index))) {
      pushUnique(hits, { offset: m.index, length: m[0].length, value: m[0], ruleId: 'RULE-PERCENT-PRICE', area: 'preise-margen' })
    }
  }

  // IBAN: shape match, then MOD-97 validation — an invalid check digit does not hit.
  for (const m of text.matchAll(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]){8,30}\b/g)) {
    if (m.index === undefined) continue
    if (isValidIban(m[0].replace(/\s+/g, ''))) {
      pushUnique(hits, { offset: m.index, length: m[0].length, value: m[0], ruleId: 'RULE-IBAN', area: 'kundendaten' })
    }
  }

  return hits.sort((a, b) => a.offset - b.offset)
}

function isValidIban(iban: string): boolean {
  if (iban.length < 15 || iban.length > 34) return false
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  let remainder = 0
  for (const ch of rearranged) {
    const code = ch >= 'A' && ch <= 'Z' ? (ch.charCodeAt(0) - 55).toString() : ch
    if (!/^\d+$/.test(code)) return false
    for (const d of code) remainder = (remainder * 10 + Number(d)) % 97
  }
  return remainder === 1
}
