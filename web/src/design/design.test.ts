import { describe, it, expect } from 'vitest'
import { motion } from './motionTokens'
import { color, GRADIENTS_ALLOWED } from './colorTokens'
import { fontFor, font } from './typeScale'
import { inspectionSweepParams } from './inspectionSweep'

describe('SF-5061 motionTokens', () => {
  it('encode the Handoff §2 timings (fidelity)', () => {
    expect(motion.typingPause.ms).toBe(600)
    expect(motion.inspectionSweepTarget.ms).toBe(800)
    expect(motion.inspectionSweepMin.ms).toBe(400)
    expect(motion.mirrorToggle).toEqual({ ms: 240, curve: 'ease-out' })
    expect(motion.threshold).toEqual({ ms: 320, curve: 'ease-in-out' })
    expect(motion.copyHint.ms).toBe(3000)
  })
})

describe('SF-5062 colorTokens', () => {
  it('§4 palette; no green token; only the sweep gradient', () => {
    expect(color.teal).toBe('#3FBFB0')
    expect(color.amber).toBe('#F5A623')
    expect(color.red).toBe('#e5657a')
    expect(Object.values(color).some((v) => /green|#0f0|#00ff00/i.test(v))).toBe(false)
    expect(GRADIENTS_ALLOWED).toEqual(['inspection-sweep'])
  })
})

describe('SF-5063 typeScale', () => {
  it('system → Mono, human → Inter, title → Fraunces', () => {
    expect(fontFor('system')).toBe(font.mono)
    expect(fontFor('human')).toBe(font.ui)
    expect(fontFor('title')).toBe(font.serif)
  })
})

describe('SF-5064 inspectionSweep', () => {
  it('period = duration, floored at the 400ms legibility minimum; 2px teal gradient', () => {
    expect(inspectionSweepParams(800).periodMs).toBe(800)
    expect(inspectionSweepParams(120).periodMs).toBe(400) // floored
    expect(inspectionSweepParams(800).heightPx).toBe(2)
    expect(inspectionSweepParams(800).gradient).toBe('transparent→teal→transparent')
  })
})
