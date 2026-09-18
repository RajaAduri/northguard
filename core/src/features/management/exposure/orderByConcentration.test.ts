import { describe, it, expect } from 'vitest'
import { orderByConcentration } from './orderByConcentration'
import type { AreaExposure } from '../../../../lib/types'

const a = (area: string, touches: number): AreaExposure => ({ area, mode: 'redact', touches, trend: 'steady', series: [] })

describe('SF-6013 orderByConcentration', () => {
  it('1. sorted desc by touches', () => {
    expect(orderByConcentration([a('x', 2), a('y', 9), a('z', 5)]).map((e) => e.area)).toEqual(['y', 'z', 'x'])
  })
  it('2. ties are stable by area label', () => {
    expect(orderByConcentration([a('kundendaten', 3), a('anmeldung', 3)]).map((e) => e.area)).toEqual(['anmeldung', 'kundendaten'])
  })
})
