import { describe, it, expect } from 'vitest'
import { buildAreaConfirmationModel } from './buildAreaConfirmationModel'
import type { Area } from '../../../../lib/types'

describe('SF-2041 buildAreaConfirmationModel', () => {
  it('1. suggested areas are editable and unconfirmed', () => {
    const m = buildAreaConfirmationModel([{ id: '1', label: 'Kundendaten' }])
    expect(m.areas[0]?.confirmed).toBe(false)
    expect(m.valid).toBe(true)
  })
  it('2. provenance is carried per area', () => {
    const areas: Area[] = [{ id: '1', label: 'Preise', provenance: 'from policy vom 12.08.' }]
    expect(buildAreaConfirmationModel(areas).areas[0]?.provenance).toContain('12.08.')
  })
  it('3. an empty area set is invalid with empty-area-set', () => {
    const m = buildAreaConfirmationModel([])
    expect(m.valid).toBe(false)
    expect(m.issues).toContain('empty-area-set')
  })
})
