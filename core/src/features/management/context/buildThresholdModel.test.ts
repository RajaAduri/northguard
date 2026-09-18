import { describe, it, expect } from 'vitest'
import { buildThresholdModel } from './buildThresholdModel'

describe('SF-6062 buildThresholdModel', () => {
  it('1. names the threshold (Sie verlassen Ihre Arbeitsfläche)', () => {
    expect(buildThresholdModel('KW 38', 12).headline).toContain('verlassen Ihre Arbeitsfläche')
  })
  it('2. states structural, no-names aggregation (NG-13)', () => {
    const t = buildThresholdModel('KW 38', 12)
    expect(t.structural).toBe(true)
    expect(t.aggregationNote).toContain('Keine Namen')
    expect(t.aggregationNote).toContain('12 Personen')
  })
  it('3. the way back is a word in the header, not a tab', () => {
    expect(buildThresholdModel('KW 38', 12).backInHeader).toBe(true)
  })
})
