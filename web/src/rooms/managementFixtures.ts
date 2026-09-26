// SF-5095 — deterministic fixtures for the management-room surfaces (Handoff rule 15:
// the document room). Tenant content only via invented data (NG-23). Non-attributable:
// observations name topics/artefacts, never people (NG-21).
export interface DuplicateRow {
  observation: string
  scope: string
  artefact: string
}
export interface BriefingFixture {
  kw: string
  range: string
  people: number
  requests: number
  duplicate: DuplicateRow[]
  estimateRange: string
  stats: { requests: number; redacted: number; blocked: number; duplicate: number }
}

export const briefingFixture: BriefingFixture = {
  kw: '39',
  range: '22.–26.09.',
  people: 5,
  requests: 214,
  estimateRange: '3–4 h',
  duplicate: [
    { observation: 'Angebotskalkulation für Wärmepumpen im Gewerbe', scope: '11 Anfragen · 3 Personen', artefact: 'Kalkulationsvorlage im Team-Wiki' },
    { observation: 'Formulierung von Wartungsvertrags-Klauseln', scope: '7 Anfragen · 2 Personen', artefact: 'Textbausteine für Wartungsverträge' },
    { observation: 'Übersetzung von Datenblättern ins Englische', scope: '4 Anfragen · 2 Personen', artefact: 'Glossar der Fachbegriffe' },
  ],
  stats: { requests: 214, redacted: 96, blocked: 4, duplicate: 22 },
}

export interface ThresholdFixture {
  kw: string
  people: number
}
export const thresholdFixture: ThresholdFixture = { kw: '39', people: 5 }
