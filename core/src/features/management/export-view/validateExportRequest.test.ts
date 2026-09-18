import { describe, it, expect } from 'vitest'
import { validateExportRequest } from './validateExportRequest'

const base = { from: '2026-09-01T00:00:00Z', to: '2026-09-30T00:00:00Z', reason: 'Kundenaudit Q3' }

describe('SF-6051 validateExportRequest', () => {
  it('1. a range + reason is valid', () => {
    expect(validateExportRequest(base)).toEqual({ valid: true, issues: [] })
  })
  it('2. a missing reason is invalid', () => {
    expect(validateExportRequest({ ...base, reason: '  ' }).issues).toContain('missing-reason')
  })
  it('3. an inverted range is invalid', () => {
    expect(validateExportRequest({ ...base, from: base.to, to: base.from }).issues).toContain('inverted-range')
  })
})
