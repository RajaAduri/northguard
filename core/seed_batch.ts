// Seed a realistic, varied batch of German engineering-SMB prompts through the real
// inspection path, for the E7 clustering experiment (step 10b). Two recurring themes
// (offers for one customer; supplier-conditions for one supplier) plus one-off prompts,
// so clustering has something real to find and something to leave alone.
// Run: npx vite-node seed_batch.ts -- <ledgerPath>
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { assembleVerdict } from './src/features/inspection/verdict'
import { loadRulesLayer } from './src/features/inspection/rules'
import { setLedgerPath } from './src/features/ledger/append'
import type { ActivePolicy, InspectionRequest, KeyMaterial } from './lib/types'

const policy: ActivePolicy = {
  policyVersion: 'v1.0', activatedAt: new Date().toISOString(), activatedBy: 'seed',
  areas: [
    { id: 'kundendaten', label: 'Kundendaten', mode: 'redact' },
    { id: 'preise-margen', label: 'Preise & Margen', mode: 'redact' },
    { id: 'lieferanten-konditionen', label: 'Lieferanten & Konditionen', mode: 'redact' },
  ],
}
const key: KeyMaterial = { secret: 'batch-secret', keyEpoch: 1 }
const ctx = { key, userId: 'batch@local', provider: 'local-llm (test stand-in)' }

// Theme A — recurring: offers for the customer Brechtmann GmbH.
const themeA = [
  'Bitte erstelle ein Angebot für die Brechtmann GmbH über Wartungsleistungen, Kontakt info@brechtmann.de.',
  'Aktualisiere das Angebot für die Brechtmann GmbH, füge eine Position Wartung hinzu, info@brechtmann.de.',
  'Erstelle erneut ein Angebot für die Brechtmann GmbH über Wartung und Service, info@brechtmann.de.',
  'Angebot für die Brechtmann GmbH über Wartungsleistungen vorbereiten, Kontakt info@brechtmann.de.',
  'Schreibe ein Angebot für die Brechtmann GmbH zu Wartung, Ansprechpartner info@brechtmann.de.',
]
// Theme B — recurring: renegotiating conditions with the supplier Haltmayer & Söhne.
const themeB = [
  'Verhandle die Konditionen mit dem Lieferanten Haltmayer & Söhne neu, Zielrabatt 8 %.',
  'Bereite die Neuverhandlung der Lieferkonditionen mit Haltmayer & Söhne vor, Rabatt 8 %.',
  'Entwirf eine Anfrage an den Lieferanten Haltmayer & Söhne zu besseren Konditionen, Rabatt 8 %.',
  'Fasse den Stand der Konditionsverhandlung mit Haltmayer & Söhne zusammen, Zielrabatt 8 %.',
]
// One-offs — distinct topics, should not cluster.
const oneOffs = [
  'Fasse das Protokoll der letzten Teambesprechung in fünf Stichpunkten zusammen.',
  'Formuliere eine Stellenausschreibung für eine Werkstudentin im Bereich Konstruktion.',
  'Erkläre kurz den Unterschied zwischen einer GmbH und einer AG.',
  'Schreibe eine freundliche Einladung zum Sommerfest des Unternehmens.',
  'Erstelle eine Checkliste für die Wartung einer CNC-Maschine.',
  'Übersetze diesen Absatz ins Englische und kürze ihn leicht.',
]

async function main() {
  const ledgerPath = process.argv.slice(2).filter((a) => a !== '--')[0]
  if (!ledgerPath) throw new Error('usage: vite-node seed_batch.ts -- <ledgerPath>')
  try { rmSync(ledgerPath, { force: true }) } catch { /* fresh */ }
  setLedgerPath(ledgerPath)
  loadRulesLayer(join(process.cwd(), '..', 'lexicons'))

  const prompts = [...themeA, ...themeB, ...oneOffs]
  for (let i = 0; i < prompts.length; i++) {
    const req: InspectionRequest = { conversationId: `batch-${i}`, turnIndex: 0, history: [], draftPrompt: prompts[i]!, locale: 'de', policyVersion: 'v1.0' }
    await assembleVerdict(req, policy, ctx)
  }
  console.log(`seeded ${prompts.length} prompts (${themeA.length} theme-A + ${themeB.length} theme-B + ${oneOffs.length} one-offs) -> ${ledgerPath}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
