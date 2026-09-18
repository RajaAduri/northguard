import { describe, it, expect } from 'vitest'
import { resolveViewContext } from './resolveViewContext'

describe('SF-6061 resolveViewContext', () => {
  it('1. management → a document context (one column, hairlines, Fraunces)', () => {
    const m = resolveViewContext('management')
    expect(m.kind).toBe('document')
    expect(m.typeface).toBe('Fraunces')
    expect(m.maxWidthPx).toBe(720)
    expect(m.sidebar).toBe(false)
  })
  it('2. workspace → a tool context (dense, cards, teal)', () => {
    const w = resolveViewContext('workspace')
    expect(w.kind).toBe('tool')
    expect(w.accent).toBe('teal')
    expect(w.sidebar).toBe(true)
  })
  it('3. the two are unmistakable at a glance (different kind + typeface)', () => {
    expect(resolveViewContext('management').kind).not.toBe(resolveViewContext('workspace').kind)
    expect(resolveViewContext('management').typeface).not.toBe(resolveViewContext('workspace').typeface)
  })
})
