import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { loadRulesLayer, runRulesLayer } from './index'
import type { ActivePolicy } from '../../../../lib/types'

// NFR-01 / NG-7: rules layer p95 < 50 ms on German test text (stop condition).
const policy: ActivePolicy = {
  policyVersion: 'v1',
  areas: [
    { id: 'kundendaten', label: 'Kundendaten', mode: 'redact', confirmed: true },
    { id: 'preise-margen', label: 'Preise & Margen', mode: 'redact', confirmed: true },
    { id: 'lieferanten-konditionen', label: 'Lieferanten & Konditionen', mode: 'redact', confirmed: true },
    { id: 'quellcode-repositories', label: 'Quellcode & Repositories', mode: 'block', confirmed: true },
    { id: 'zugangsdaten', label: 'Zugangsdaten', mode: 'block', confirmed: true },
    { id: 'projektcodenamen', label: 'Projektcodenamen', mode: 'redact', confirmed: true },
  ],
  activatedAt: 't',
  activatedBy: 'lead',
}

const GERMAN =
  'Sehr geehrte Damen und Herren, unser Lieferant Brechtmann GmbH hat die Zielmarge von 34 % bestätigt. ' +
  'Bitte senden Sie die Unterlagen an anna.berger@nordwerk.de unter dem Vertrag CN-48213. ' +
  'Das interne Repository shiftnorth-core enthält die Preisstufe und die Konditionen. ' +
  'Die Qualitätssicherungsvereinbarung (QSV) mit HRB 12345 ist vertraulich. Konto DE89 3704 0044 0532 0130 00. '

describe('AF-301 rules-layer latency (NFR-01)', () => {
  it('p95 over German text is < 50 ms', () => {
    loadRulesLayer(join(process.cwd(), '..', 'lexicons'))
    const text = GERMAN.repeat(6) // ~a realistic multi-paragraph prompt
    const N = 200
    const samples: number[] = []
    for (let i = 0; i < N; i++) {
      const t0 = performance.now()
      runRulesLayer({ prompt: text, policy, locale: 'de' })
      samples.push(performance.now() - t0)
    }
    samples.sort((a, b) => a - b)
    const p95 = samples[Math.floor(N * 0.95)] ?? samples[samples.length - 1] ?? 0
    // eslint-disable-next-line no-console
    console.log(`rules-layer p95 = ${p95.toFixed(3)} ms over ${text.length} chars`)
    expect(p95).toBeLessThan(50)
  })
})
