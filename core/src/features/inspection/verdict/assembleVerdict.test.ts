import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

let dir: string
let path: string
beforeEach(() => {
  loadRulesLayer(join(process.cwd(), '..', 'lexicons'))
  dir = mkdtempSync(join(tmpdir(), 'ng-verdict-'))
  path = join(dir, 'ledger.jsonl')
  setLedgerPath(path)
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

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

  it('4. the ledger entry carries actorPseudonym, never the raw user id (NG-19), and coverage full when rules decide', async () => {
    const v = await assembleVerdict(req('Bitte an anna.berger@nordwerk.de'), policy, ctx)
    expect(v.coverage).toBe('full') // rule hit → backstop not invoked
    const entry = JSON.parse(readFileSync(path, 'utf8').trim())
    expect(entry.actorPseudonym).toMatch(/^[0-9a-f]{64}$/)
    expect(readFileSync(path, 'utf8')).not.toContain('anna.berger')
  })
})
