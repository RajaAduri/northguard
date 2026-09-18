import { describe, it, expect } from 'vitest'
import { buildRequestEntry } from './buildRequestEntry'
import type { InspectionVerdict, KeyMaterial, RequestMeta } from '../../../../lib/types'

const key: KeyMaterial = { secret: 's', keyEpoch: 1 }
const meta: RequestMeta = { userId: 'anna.berger', promptHash: 'ph', provider: 'eu-endpoint', latencyMs: 42, key }

const verdict: InspectionVerdict = {
  verdict: 'redact',
  touchedAreas: [{ area: 'lieferanten-konditionen', mode: 'redact', layers: ['rule'] }],
  spans: [{ offset: 0, length: 4, area: 'lieferanten-konditionen', layer: 'rule', placeholder: '⟨Lieferant⟩', pseudonym: 'ab12', keyEpoch: 1 }],
  redactedPrompt: 'Frage zu ⟨Lieferant⟩',
  displayPlaceholders: [{ placeholder: '⟨Lieferant⟩', area: 'lieferanten-konditionen', layer: 'rule', index: 0 }],
  confidence: 1,
  caughtBy: 'rules',
  coverage: 'full',
  ledgerEntryId: '',
}

describe('SF-4021 buildRequestEntry', () => {
  it('1. verdict fields recorded (verdict, mode, caughtBy, coverage, touchedAreas)', () => {
    const e = buildRequestEntry(verdict, meta)
    expect(e).toMatchObject({ verdict: 'redact', mode: 'redact', caughtBy: 'rules', coverage: 'full', touchedAreas: ['lieferanten-konditionen'] })
  })
  it('2. span pseudonyms attached (pseudonym + keyEpoch), no originals', () => {
    const e = buildRequestEntry(verdict, meta)
    expect(e.spanPseudonyms).toEqual([{ area: 'lieferanten-konditionen', layer: 'rule', pseudonym: 'ab12', keyEpoch: 1 }])
  })
  it('3. actorPseudonym set from userId; the raw id never lands on the entry (NG-19)', () => {
    const e = buildRequestEntry(verdict, meta)
    expect(e.actorPseudonym).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.stringify(e)).not.toContain('anna.berger')
    expect((e as Record<string, unknown>).user).toBeUndefined()
  })
})
