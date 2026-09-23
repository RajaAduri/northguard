// Seed a ledger with real request entries by running the actual inspection path over a
// batch of German prompts. Used by the B4 bridge demo (step 6) and the clustering
// experiment (step 10). Near-duplicate "Angebot" prompts sharing a contract + email
// produce a recurring-work cluster; distinct prompts do not. Rule-triggering prompts
// keep seeding fast (no model call). Run: npx vite-node seed_ledger.ts -- <ledgerPath>
import { rmSync } from 'node:fs'
import { assembleVerdict } from './src/features/inspection/verdict'
import { loadRulesLayer } from './src/features/inspection/rules'
import { setLedgerPath } from './src/features/ledger/append'
import type { ActivePolicy, InspectionRequest, KeyMaterial } from './lib/types'
import { join } from 'node:path'

const policy: ActivePolicy = {
  policyVersion: 'v1.0', activatedAt: new Date().toISOString(), activatedBy: 'seed',
  areas: [
    { id: 'preise-margen', label: 'Preise & Margen', mode: 'redact' },
    { id: 'kundendaten', label: 'Kundendaten', mode: 'redact' },
    { id: 'lieferanten-konditionen', label: 'Lieferanten & Konditionen', mode: 'redact' },
  ],
}
const key: KeyMaterial = { secret: 'seed-secret', keyEpoch: 1 }
const ctx = { key, userId: 'seed@local', provider: 'local-llm (test stand-in)' }

// Eight near-duplicate offer-drafting prompts sharing one contract + contact (recurring
// work), plus four distinct one-offs.
const recurring = [
  'Bitte erstelle ein Angebot für Vertrag CN-4471, Kontakt kunde@example.de, mit Zielmarge 30 %.',
  'Kannst du ein Angebot zu Vertrag CN-4471 an kunde@example.de aufsetzen, Zielmarge 30 %?',
  'Angebot für Vertrag CN-4471 an kunde@example.de erstellen, Marge 30 %.',
  'Erstelle bitte erneut ein Angebot für CN-4471, Kontakt kunde@example.de, Zielmarge 30 %.',
  'Neues Angebot Vertrag CN-4471 für kunde@example.de vorbereiten, Marge 30 %.',
  'Bitte ein weiteres Angebot zu CN-4471 an kunde@example.de, Zielmarge 30 %.',
  'Angebot Vertrag CN-4471 an kunde@example.de, bitte mit Zielmarge 30 % kalkulieren.',
  'Setze ein Angebot für Vertrag CN-4471 auf, Kontakt kunde@example.de, Marge 30 %.',
]
const oneOffs = [
  'Formuliere eine Absage an lieferant@zulief.de zu Vertrag CT-9002, Rabatt 8 %.',
  'Schreibe eine Terminbestätigung für Vertrag VN-3310, Kontakt buero@firma.de.',
  'Fasse den Wartungsbericht für Vertrag CN-7788 an technik@example.de zusammen.',
  'Entwirf eine Preisanfrage an einkauf@lieferant.de mit Aufschlag 12 %.',
]

async function main() {
  const ledgerPath = process.argv.slice(2).filter((a) => a !== '--')[0]
  if (!ledgerPath) throw new Error('usage: vite-node seed_ledger.ts -- <ledgerPath>')
  try { rmSync(ledgerPath, { force: true }) } catch { /* fresh */ }
  setLedgerPath(ledgerPath)
  loadRulesLayer(join(process.cwd(), '..', 'lexicons'))

  const prompts = [...recurring, ...oneOffs]
  for (let i = 0; i < prompts.length; i++) {
    const req: InspectionRequest = {
      conversationId: `seed-${i}`, turnIndex: 0, history: [],
      draftPrompt: prompts[i]!, locale: 'de', policyVersion: 'v1.0',
    }
    await assembleVerdict(req, policy, ctx)
  }
  console.log(`seeded ${prompts.length} request entries -> ${ledgerPath}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
