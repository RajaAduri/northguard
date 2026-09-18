import { describe, it, expect } from 'vitest'
import { setAreaMode, withDefaultModes } from './setAreaMode'
import type { Area } from '../../../../lib/types'

const areas: Area[] = [
  { id: '1', label: 'Kundendaten', confirmed: true },
  { id: '2', label: 'Zugangsdaten', confirmed: true },
]

describe('SF-2051 setAreaMode', () => {
  it('1. sets an area mode to block | redact', () => {
    expect(setAreaMode(areas, '2', 'block').find((a) => a.id === '2')?.mode).toBe('block')
    expect(setAreaMode(areas, '1', 'redact').find((a) => a.id === '1')?.mode).toBe('redact')
  })
  it('2. an unknown areaId throws', () => {
    expect(() => setAreaMode(areas, 'nope', 'block')).toThrow()
  })
  it('3. unset modes default to redact (conservative-but-usable)', () => {
    expect(withDefaultModes(areas).every((a) => a.mode === 'redact')).toBe(true)
  })
})
