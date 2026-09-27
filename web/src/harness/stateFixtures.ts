import type { ComposerState, InspectionVerdict, PlaceholderMapping, RedactionSpan, RehydrateResult } from '../types'

// SF-5091 — deterministic fixtures for every composer state the Handoff §1.1 enumerates
// as a distinct visual. Consumed by BOTH the fidelity gates and the Playwright screenshot
// capture, so "what the gate checks" and "what a human reviews" are the same surface.
// Demo data uses invented tenants only (NG-23 / Handoff rule 23): Nordwerk Systemtechnik
// GmbH, Brechtmann GmbH, Haltmayer & Söhne; the provider is "EU-gehosteter Endpunkt".

const PS = (seed: string): string => (seed + '0').repeat(64).slice(0, 64)

function span(partial: Omit<RedactionSpan, 'pseudonym' | 'keyEpoch'> & Partial<Pick<RedactionSpan, 'pseudonym' | 'keyEpoch'>>): RedactionSpan {
  return { pseudonym: PS(partial.placeholder), keyEpoch: 1, ...partial }
}

const clean: InspectionVerdict = {
  verdict: 'clean',
  touchedAreas: [],
  spans: [],
  redactedPrompt: 'Fasse die Vorteile von Wärmepumpen für Gewerbekunden zusammen.',
  displayPlaceholders: [],
  confidence: 1,
  caughtBy: null,
  coverage: 'full',
  ledgerEntryId: 'fx-clean',
}

const touched: InspectionVerdict = {
  verdict: 'redact',
  touchedAreas: [
    { area: 'Kundendaten', mode: 'redact', layers: ['rule'] },
    { area: 'Lieferanten & Konditionen', mode: 'redact', layers: ['llm'] },
  ],
  spans: [
    span({ offset: 22, length: 24, area: 'Kundendaten', layer: 'rule', ruleId: 'RULE-EMAIL', placeholder: '⟨E-Mail-Adresse 1⟩' }),
    span({ offset: 66, length: 15, area: 'Lieferanten & Konditionen', layer: 'llm', placeholder: '⟨Lieferant 1⟩' }),
  ],
  redactedPrompt: 'Schreib eine E-Mail an ⟨E-Mail-Adresse 1⟩ zu den Konditionen von ⟨Lieferant 1⟩.',
  displayPlaceholders: [],
  confidence: 0.94,
  caughtBy: 'rules+llm',
  coverage: 'full',
  ledgerEntryId: 'fx-touched',
}

const blocked: InspectionVerdict = {
  verdict: 'block',
  touchedAreas: [{ area: 'Zugangsdaten', mode: 'block', layers: ['llm'], echoBlockedSpans: false }],
  spans: [span({ offset: 19, length: 12, area: 'Zugangsdaten', layer: 'llm', placeholder: '⟨Zugangsdaten⟩' })],
  redactedPrompt: 'Nutze das Passwort ⟨Zugangsdaten⟩ für den Login.',
  displayPlaceholders: [],
  confidence: 0.98,
  caughtBy: 'llm',
  coverage: 'full',
  ledgerEntryId: 'fx-blocked',
}

const degraded: InspectionVerdict = {
  verdict: 'clean',
  touchedAreas: [],
  spans: [],
  redactedPrompt: 'Erstelle eine Angebotsvorlage für Wartungsverträge.',
  displayPlaceholders: [],
  confidence: 1,
  caughtBy: null,
  coverage: 'rules-only',
  ledgerEntryId: 'fx-degraded',
}

export interface StateFixture {
  key: string // the screenshot / panel id
  label: string // Handoff §1.1 state name (for the harness caption; not a UI string)
  state: ComposerState
  verdict: InspectionVerdict | null
  degraded: boolean
  draft: string
}

// F5/NG-25 — a reply showing all three run classes at once: a rehydrated value (dotted),
// masked-open placeholders NorthGuard removed (⟨Termin⟩, ⟨E-Mail-Adresse⟩ — in the mapping),
// and a gap the MODEL left (⟨Empfängername⟩ — not in the mapping). This is the screenshot that
// decides whether F5 landed. Markdown too (bold + list) to show F1.
export const replyFixture: { result: RehydrateResult; mapping: PlaceholderMapping; providerText: string } = {
  result: {
    restoredText:
      'Sehr geehrte/r ⟨Empfängername⟩,\n\nanbei die **Konditionen** für Brechtmann GmbH zum ⟨Termin⟩:\n\n- Marge: 34 %\n- Kontakt: ⟨E-Mail-Adresse⟩\n\nMit freundlichen Grüßen',
    restoredSpans: [{ placeholder: '⟨Lieferant⟩', original: 'Brechtmann GmbH', offset: 0, length: 15 }],
    unresolved: ['⟨Empfängername⟩', '⟨Termin⟩', '⟨E-Mail-Adresse⟩'],
  },
  mapping: { '⟨Termin⟩': 'nächsten Dienstag', '⟨E-Mail-Adresse⟩': 'anna.berger@nordwerk.de' },
  providerText: 'Sehr geehrte/r ⟨Empfängername⟩, anbei die Konditionen für ⟨Lieferant⟩ zum ⟨Termin⟩: Marge ⟨Marge⟩, Kontakt ⟨E-Mail-Adresse⟩.',
}

export const composerStateFixtures: StateFixture[] = [
  { key: 'clean', label: 'clean · 0 Funde', state: 'clean', verdict: clean, degraded: false, draft: clean.redactedPrompt },
  { key: 'checking', label: 'inspecting · Prüfung läuft', state: 'inspecting', verdict: null, degraded: false, draft: 'Schreib eine E-Mail an Frau Berger zu den Konditionen.' },
  { key: 'touched', label: 'touched · maskiert', state: 'touched', verdict: touched, degraded: false, draft: 'Schreib eine E-Mail an anna.berger@nordwerk.de zu den Konditionen von Brechtmann GmbH.' },
  { key: 'blocked', label: 'blocked · Zugangsdaten', state: 'blocked', verdict: blocked, degraded: false, draft: "Nutze das Passwort für den Login." },
  { key: 'degraded', label: 'degraded · nur Regeln', state: 'clean', verdict: degraded, degraded: true, draft: degraded.redactedPrompt },
]
