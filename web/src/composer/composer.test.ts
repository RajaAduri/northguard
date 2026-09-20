import { describe, it, expect, vi } from 'vitest'
import { composerReducer } from './composerReducer'
import { deriveComposerView } from './deriveComposerView'
import { inspectionDebounce } from './inspectionDebounce'
import { resolvePendingSend } from './resolvePendingSend'
import type { InspectionVerdict } from '../types'

const verdict = (touched: number): InspectionVerdict => ({
  verdict: touched === 0 ? 'clean' : 'redact', touchedAreas: Array.from({ length: touched }, () => ({ area: 'kundendaten', mode: 'redact', layers: ['rule'] })),
  spans: [], redactedPrompt: 'x', displayPlaceholders: [], confidence: 1, caughtBy: null, coverage: 'full', ledgerEntryId: 'e1',
})

describe('SF-5011 composerReducer (§1.1 transitions)', () => {
  it('locked until areas confirmed (NG-3)', () => {
    expect(composerReducer('locked', { type: 'edit' })).toBe('locked')
    expect(composerReducer('locked', { type: 'areas-confirmed' })).toBe('idle')
  })
  it('typing → inspecting on pause/submit; edit aborts inspecting back to typing', () => {
    expect(composerReducer('typing', { type: 'pause' })).toBe('inspecting')
    expect(composerReducer('typing', { type: 'submit' })).toBe('inspecting')
    expect(composerReducer('inspecting', { type: 'edit' })).toBe('typing')
  })
  it('verdict routes clean/redact/block', () => {
    expect(composerReducer('inspecting', { type: 'verdict', verdict: 'clean' })).toBe('clean')
    expect(composerReducer('inspecting', { type: 'verdict', verdict: 'redact' })).toBe('touched')
    expect(composerReducer('inspecting', { type: 'verdict', verdict: 'block' })).toBe('blocked')
  })
  it('report flow from a finding; any keystroke returns to typing', () => {
    expect(composerReducer('touched', { type: 'report' })).toBe('report')
    expect(composerReducer('report', { type: 'report-done' })).toBe('report-done')
    expect(composerReducer('blocked', { type: 'edit' })).toBe('typing')
  })
  it('areas-unconfirmed re-locks from any state', () => {
    expect(composerReducer('clean', { type: 'areas-unconfirmed' })).toBe('locked')
  })
})

describe('SF-5012 deriveComposerView', () => {
  it('clean → teal send, no mirror', () => {
    const v = deriveComposerView('clean', verdict(0))
    expect(v.sendTone).toBe('teal')
    expect(v.mirrorOpen).toBe(false)
    expect(v.statusKey).toBe('composer.status_clean')
  })
  it('touched → amber "send redacted", mirror open, areas_touched(_one)', () => {
    expect(deriveComposerView('touched', verdict(1)).areaMenuLabelKey).toBe('header.areas_touched_one')
    const v = deriveComposerView('touched', verdict(2))
    expect(v.sendLabelKey).toBe('composer.send_redacted')
    expect(v.borderTone).toBe('amber')
    expect(v.mirrorOpen).toBe(true)
    expect(v.areaMenuLabelKey).toBe('header.areas_touched')
  })
  it('blocked → red border, disabled send', () => {
    const v = deriveComposerView('blocked', verdict(1))
    expect(v.borderTone).toBe('red')
    expect(v.sendTone).toBe('disabled')
  })
  it('degraded overlay → rules-only area menu + flag on any state', () => {
    expect(deriveComposerView('clean', verdict(0), true).areaMenuLabelKey).toBe('header.rules_only')
    expect(deriveComposerView('clean', verdict(0), true).degraded).toBe(true)
  })
})

describe('SF-5013 inspectionDebounce', () => {
  it('fires once after the pause; resets on each keystroke', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const d = inspectionDebounce(fn, 600)
    d.onKeystroke()
    vi.advanceTimersByTime(400)
    d.onKeystroke() // reset
    vi.advanceTimersByTime(400)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
  it('onSubmit fires immediately; cancel prevents a pending fire', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const d = inspectionDebounce(fn, 600)
    d.onSubmit()
    expect(fn).toHaveBeenCalledTimes(1)
    d.onKeystroke()
    d.cancel()
    vi.advanceTimersByTime(600)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

describe('SF-5014 resolvePendingSend', () => {
  it('auto-send on clean; stop on a finding', () => {
    expect(resolvePendingSend(true, 'clean')).toBe('auto-send')
    expect(resolvePendingSend(true, 'redact')).toBe('stop')
    expect(resolvePendingSend(true, 'block')).toBe('stop')
    expect(resolvePendingSend(false, 'clean')).toBe('stop')
  })
})
