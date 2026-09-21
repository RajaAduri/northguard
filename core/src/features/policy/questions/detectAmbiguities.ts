import type { Ambiguity, WorkingSet } from '../../../../lib/types'

// Areas whose boundary a quality lead can genuinely settle (worth asking). Anything a
// static checkbox could answer is NOT here (SF-2082 never invents those).
const BOUNDARY_QUESTIONS: Record<string, string> = {
  kundendaten: 'Ihre Richtlinie nennt „Kundendaten“ — zählen dazu auch Ansprechpartner beim Lieferanten?',
  'lieferanten-konditionen': 'Zählen zu „Lieferanten & Konditionen“ auch interne Zielpreise, oder nur die vereinbarten Konditionen?',
  'preise-margen': 'Gilt „Preise & Margen“ auch für unverbindliche Angebote, oder nur für kalkulierte Margen?',
}

// SF-2081 — raise a question only where a pass left a genuine boundary ambiguity. A
// clean, unambiguous set → []. Deterministic.
export function detectAmbiguities(working: WorkingSet): Ambiguity[] {
  const out: Ambiguity[] = []
  for (const area of working.areas) {
    const q = BOUNDARY_QUESTIONS[area.id]
    if (q) out.push({ areaId: area.id, kind: 'boundary', question: q })
  }
  return out
}
