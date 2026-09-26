import type { BriefingInputs } from '../types'

// SF-5095 — a fixture for the management surface. It is a raw BriefingInputs fed through the
// real buildBriefingView (same path the app uses with the gateway's inputs), NOT a
// hand-shaped view — so the screenshot renders exactly what the app renders (Sprint 10 F2).
// Invented tenants only (NG-23); non-attributable: topics/artefacts, never people (NG-21).
export const briefingInputsFixture: BriefingInputs = {
  week: '39',
  people: 5,
  stats: { requests: 214, redactedForwarded: 96, blocked: 4, rulesOnlyRequests: 8 },
  findings: [
    { theme: 'Angebotskalkulation für Wärmepumpen im Gewerbe', area: 'preise-margen', clusterSize: 11, hoursSavedLow: 1.5, hoursSavedHigh: 2, artefact: 'Kalkulationsvorlage im Team-Wiki' },
    { theme: 'Formulierung von Wartungsvertrags-Klauseln', area: 'lieferanten-konditionen', clusterSize: 7, hoursSavedLow: 1, hoursSavedHigh: 1, artefact: 'Textbausteine für Wartungsverträge' },
    { theme: 'Übersetzung von Datenblättern ins Englische', area: 'kundendaten', clusterSize: 4, hoursSavedLow: 0.5, hoursSavedHigh: 1, artefact: 'Glossar der Fachbegriffe' },
  ],
  sufficient: true,
}

export const thresholdFixture = { week: '39', people: 5 }
export const briefingRange = '22.–26.09.'
