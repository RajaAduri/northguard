import { describe, it, expect } from 'vitest'
import { validateAreaSet } from './validateAreaSet'
import type { Area } from '../../../../lib/types'

const a = (id: string, label: string): Area => ({ id, label, confirmed: false })

describe('SF-2043 validateAreaSet', () => {
  it('1. duplicate labels raise duplicate-label', () => {
    const r = validateAreaSet([a('1', 'Kundendaten'), a('2', 'Kundendaten')])
    expect(r.valid).toBe(false)
    expect(r.issues).toContain('duplicate-label')
  })
  it('2. an empty set raises empty-area-set', () => {
    expect(validateAreaSet([])).toEqual({ valid: false, issues: ['empty-area-set'] })
  })
  it('3. a valid set is valid with no issues', () => {
    expect(validateAreaSet([a('1', 'Kundendaten'), a('2', 'Preise')])).toEqual({ valid: true, issues: [] })
  })
})
