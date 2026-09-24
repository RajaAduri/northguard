import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { assembleVerdict, type InspectionContext } from './index'
import { loadRulesLayer } from '../rules'
import { setLedgerPath } from '../../ledger/append'
import type { ActivePolicy, InspectionRequest } from '../../../../lib/types'

const policy: ActivePolicy = {
  policyVersion: 'v1',
  areas: [
    { id: 'kundendaten', label: 'Kundendaten', mode: 'redact', confirmed: true },
    { id: 'lieferanten-konditionen', label: 'Lieferanten & Konditionen', mode: 'redact', confirmed: true },
    { id: 'preise-margen', label: 'Preise & Margen', mode: 'redact', confirmed: true },
    { id: 'zugangsdaten', label: 'Zugangsdaten', mode: 'block', confirmed: true },
    { id: 'quellcode-repositories', label: 'Quellcode & Repositories', mode: 'block', confirmed: true },
    { id: 'projektcodenamen', label: 'Projektcodenamen', mode: 'redact', confirmed: true },
  ],
  activatedAt: 't',
  activatedBy: 'lead',
}
const ctx: InspectionContext = { key: { secret: 'customer-secret', keyEpoch: 1 }, userId: 'anna.berger', provider: 'eu-endpoint' }
const req = (draftPrompt: string): InspectionRequest => ({
  conversationId: 'c1', turnIndex: 0, history: [], draftPrompt, locale: 'de', policyVersion: 'v1',
})

// The backstop now runs on every model-relevant policy, so tests must control it rather
// than rely on a skip. `modelResponder` returns the contextual findings the model would
// make (offsets computed from the prompt); `backstopAvailable` toggles the /health guard.
type Find = { value: string; area: string }
let modelResponder: (prompt: string) => Find[]
let backstopAvailable: boolean
const finds = (vs: Find[]) => (_p: string) => vs

let dir: string
let path: string
beforeEach(() => {
  loadRulesLayer(join(process.cwd(), '..', 'lexicons'))
  dir = mkdtempSync(join(tmpdir(), 'ng-verdict-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
  modelResponder = () => []
  backstopAvailable = true
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (String(url).includes('/health')) {
      if (!backstopAvailable) throw new TypeError('backstop down')
      return new Response('{"ok":true}', { status: 200 })
    }
    const body = JSON.parse((init?.body as string) ?? '{}') as { user?: string }
    const prompt = String(body.user ?? '').replace(/^TEXT:\n/, '')
    // value-based contract: the model returns {area, value}; the core anchors it.
    const findings = modelResponder(prompt).map((f) => ({ area: f.area, value: f.value }))
    return new Response(JSON.stringify({ completion: JSON.stringify({ findings }) }), { status: 200 })
  }))
})
afterEach(() => {
  vi.unstubAllGlobals()
  rmSync(dir, { recursive: true, force: true })
})

describe('SF-3035 assembleVerdict (AF-303 full turn)', () => {
  it('1. a clean prompt → verdict clean, ledger entry written, entryId set (NG-5)', async () => {
    const v = await assembleVerdict(req('danke'), policy, ctx)
    expect(v.verdict).toBe('clean')
    expect(v.ledgerEntryId).not.toBe('')
    expect(readFileSync(path, 'utf8').trim().split('\n')).toHaveLength(1)
  })

  it('2. a redact-area touch → verdict redact; redactedPrompt has placeholders, no original', async () => {
    const v = await assembleVerdict(req('Bitte an anna.berger@nordwerk.de zur Zielmarge von 34 %'), policy, ctx)
    expect(v.verdict).toBe('redact')
    expect(v.redactedPrompt).not.toContain('anna.berger@nordwerk.de')
    expect(v.redactedPrompt).toContain('⟨')
    expect(v.spans.every((s) => s.placeholder.startsWith('⟨') && /^[0-9a-f]{64}$/.test(s.pseudonym))).toBe(true)
    expect(v.ledgerEntryId).not.toBe('')
  })

  it('3. a block-area touch → verdict block', async () => {
    const v = await assembleVerdict(req('Das Passwort für den Zugang lautet geheim'), policy, ctx)
    expect(v.verdict).toBe('block')
    expect(v.ledgerEntryId).not.toBe('')
  })

  it('4. NG-24: model ran to completion → coverage full; actor stored as pseudonym (NG-19)', async () => {
    const v = await assembleVerdict(req('Bitte an anna.berger@nordwerk.de'), policy, ctx)
    expect(v.coverage).toBe('full') // the backstop was reachable and ran
    const entry = JSON.parse(readFileSync(path, 'utf8').trim())
    expect(entry.actorPseudonym).toMatch(/^[0-9a-f]{64}$/)
    expect(readFileSync(path, 'utf8')).not.toContain('anna.berger')
  })
})

// The blind spot that survived seven sprints: no test put a rule-detectable entity and a
// model-only entity in the SAME prompt. This matrix pins every combination.
describe('NG-24 coverage honesty + mixed-entity leak regression matrix', () => {
  const CUSTOMER = 'Brechtmann GmbH'
  const PERSON = 'Klaus Meibert'
  const EMAIL = 'klaus.meibert@brechtmann.de'
  const CONTRACT = 'CN-4471'

  it('rule-only entity (email): rules redact it, model adds nothing → no leak, coverage full', async () => {
    modelResponder = finds([])
    const v = await assembleVerdict(req(`Mail an ${EMAIL} bitte`), policy, ctx)
    expect(v.redactedPrompt).not.toContain(EMAIL)
    expect(v.coverage).toBe('full')
  })

  it('model-only entity (customer name, no rule hit): model catches it → no leak, coverage full', async () => {
    modelResponder = finds([{ value: CUSTOMER, area: 'kundendaten' }])
    const v = await assembleVerdict(req(`Schreibe eine Notiz über die ${CUSTOMER}`), policy, ctx)
    expect(v.redactedPrompt).not.toContain(CUSTOMER)
    expect(v.verdict).toBe('redact')
    expect(v.coverage).toBe('full')
  })

  it('BOTH together (the original leak): email+contract by rules, names by model → NOTHING leaks', async () => {
    modelResponder = finds([{ value: CUSTOMER, area: 'kundendaten' }, { value: PERSON, area: 'kundendaten' }])
    const v = await assembleVerdict(req(`Bitte schreibe eine kurze E-Mail an die ${CUSTOMER}, Ansprechpartner ${PERSON} (${EMAIL}), zu Vertrag ${CONTRACT}.`), policy, ctx)
    for (const original of [CUSTOMER, PERSON, EMAIL, CONTRACT]) expect(v.redactedPrompt).not.toContain(original)
    expect(v.coverage).toBe('full')
  })

  it('both in a SHORT prompt: "E-Mail an Klaus Meibert: k@x.de" → neither leaks', async () => {
    modelResponder = finds([{ value: PERSON, area: 'kundendaten' }])
    const v = await assembleVerdict(req(`E-Mail an ${PERSON}: kurz@x.de`), policy, ctx)
    expect(v.redactedPrompt).not.toContain(PERSON)
    expect(v.redactedPrompt).not.toContain('kurz@x.de')
  })

  it('both in a LONG prompt → neither leaks', async () => {
    modelResponder = finds([{ value: CUSTOMER, area: 'kundendaten' }])
    const filler = 'Wir bereiten die Quartalsunterlagen vor und stimmen die nächsten Schritte im Team ab. '.repeat(6)
    const v = await assembleVerdict(req(`${filler} Bitte informiere die ${CUSTOMER} unter ${EMAIL} über den Termin.`), policy, ctx)
    expect(v.redactedPrompt).not.toContain(CUSTOMER)
    expect(v.redactedPrompt).not.toContain(EMAIL)
    expect(v.coverage).toBe('full')
  })

  it('backstop UNAVAILABLE on a mixed prompt → coverage rules-only (NG-24), degradation recorded not hidden', async () => {
    backstopAvailable = false
    modelResponder = finds([{ value: CUSTOMER, area: 'kundendaten' }]) // would-be finding, but the model never runs
    const v = await assembleVerdict(req(`Mail an ${EMAIL} über die ${CUSTOMER}`), policy, ctx)
    expect(v.coverage).toBe('rules-only') // NOT full — the model layer did not run
    expect(v.redactedPrompt).not.toContain(EMAIL) // rules still protect what they can
    const entry = JSON.parse(readFileSync(path, 'utf8').trim())
    expect(entry.coverage).toBe('rules-only') // the ledger records the reduced coverage (NG-4)
  })
})
