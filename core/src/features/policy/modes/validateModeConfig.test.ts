import { describe, it, expect } from 'vitest'
import { validateModeConfig } from './validateModeConfig'
import type { Area } from '../../../../lib/types'

describe('SF-2052 validateModeConfig', () => {
  it('1. every area has a mode → valid', () => {
    const r = validateModeConfig([
      { id: '1', label: 'K', mode: 'redact' },
      { id: '2', label: 'Z', mode: 'block' },
    ])
    expect(r).toEqual({ valid: true, issues: [] })
  })
  it('2. a missing mode raises unassigned-mode', () => {
    const r = validateModeConfig([{ id: '1', label: 'K' }])
    expect(r.valid).toBe(false)
    expect(r.issues).toContain('unassigned-mode')
  })
  it('3. all block is valid (allowed)', () => {
    expect(
      validateModeConfig([
        { id: '1', label: 'K', mode: 'block' },
        { id: '2', label: 'Z', mode: 'block' },
      ]),
    ).toEqual({ valid: true, issues: [] })
  })
})
