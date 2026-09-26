import { describe, it, expect } from 'vitest'
import { radius, RADII_ALLOWED } from './radii'

describe('SF-5065 radii', () => {
  it('encode the Handoff §4 radius scale exactly', () => {
    expect(radius.composer).toBe(14)
    expect(radius.bubble).toBe(14)
    expect(radius.card).toBe(12)
    expect(radius.popover).toBe(12)
    expect(radius.mirror).toBe(10)
    expect(radius.info).toBe(10)
    expect(radius.button).toBe(9)
    expect(radius.smallButton).toBe(8)
    expect(radius.headerButton).toBe(8)
    expect(radius.row).toBe(8)
    expect(radius.tab).toBe(6)
    expect(radius.menuRow).toBe(6)
    expect(radius.chip).toBe(5)
  })

  it('exposes exactly the §4 radius values as the allowed set (no invented radii)', () => {
    expect([...RADII_ALLOWED].sort((a, b) => a - b)).toEqual([5, 6, 8, 9, 10, 12, 14])
  })
})
