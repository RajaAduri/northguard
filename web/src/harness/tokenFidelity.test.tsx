import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { color, GRADIENTS_ALLOWED } from '../design/colorTokens'
import { font } from '../design/typeScale'
import { RADII_ALLOWED } from '../design/radii'
import { StatesHarness } from './StatesHarness'

afterEach(cleanup)

// SF-5093 — the token-fidelity gate. Every rendered element on the product surface must
// take its colour, font family and radius from a §4 token: no raw hex outside the token
// modules, no browser-default font, no invented radius, and no gradient except the
// inspection sweep. This is the gate whose absence let Sprint 6 ship an unstyled shell.
const HEX_TOKENS = new Set(Object.values(color).map((v) => v.toLowerCase()))
const normFont = (f: string): string => f.replace(/["']/g, '').replace(/\s+/g, '').toLowerCase()
const FONT_TOKENS = new Set(Object.values(font).map(normFont))
const RADII = new Set<number>(RADII_ALLOWED as readonly number[])

function capturedElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-capture], [data-capture] *'))
}

function violationsFor(root: HTMLElement): string[] {
  const out: string[] = []
  for (const el of capturedElements(root)) {
    const css = el.style.cssText.toLowerCase()
    if (!css) continue
    const tag = `<${el.tagName.toLowerCase()} testid=${el.getAttribute('data-testid') ?? ''}>`

    for (const hex of css.match(/#[0-9a-f]{3,8}/g) ?? []) {
      if (!HEX_TOKENS.has(hex)) out.push(`${tag} raw hex ${hex}`)
    }
    if (css.includes('gradient')) {
      const g = el.getAttribute('data-gradient')
      if (!g || !(GRADIENTS_ALLOWED as readonly string[]).includes(g)) out.push(`${tag} gradient without an allowed data-gradient`)
    }
    if (el.style.fontFamily && !FONT_TOKENS.has(normFont(el.style.fontFamily))) {
      out.push(`${tag} non-token font-family ${el.style.fontFamily}`)
    }
    for (const m of css.matchAll(/border(?:-[a-z]+)?-radius:\s*([^;]+)/g)) {
      for (const px of m[1].match(/\d+(?:\.\d+)?/g) ?? []) {
        if (!RADII.has(Number(px))) out.push(`${tag} non-token radius ${px}px`)
      }
    }
  }
  return out
}

describe('SF-5093 token-fidelity gate (§4)', () => {
  it('DE surface uses only §4 tokens (colour, font, radius, gradient)', () => {
    const { container } = render(<StatesHarness locale="de" />)
    expect(violationsFor(container)).toEqual([])
  })

  it('EN surface uses only §4 tokens', () => {
    const { container } = render(<StatesHarness locale="en" />)
    expect(violationsFor(container)).toEqual([])
  })
})
