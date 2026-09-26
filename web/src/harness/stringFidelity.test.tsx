import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import type { Locale } from '../types'
import { formatMessage } from '../i18n'
import { StatesHarness } from './StatesHarness'

afterEach(cleanup)

// SF-5094 — the string-fidelity gate. Every user-visible string on the product surface is
// asserted against the Handoff §3 catalogue, per language: an element carrying a catalogue
// key must render exactly formatMessage(key, locale, params), and no text node may exist
// outside a catalogue key or an explicit content marker. So "Maskiert senden" on a clean
// composer, an English string in the German UI, or any hardcoded label becomes a failure.
const EXEMPT_TEXT = /^[\s·,.|—–\-:()„""%\d/]+$/

function keyedViolations(root: HTMLElement, locale: Locale): string[] {
  const out: string[] = []
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-capture] [data-i18n-key]'))) {
    const key = el.getAttribute('data-i18n-key')!
    const raw = el.getAttribute('data-i18n-params')
    const params = raw ? (JSON.parse(raw) as Record<string, string | number>) : undefined
    const expected = formatMessage(key, locale, params)
    if (el.textContent !== expected) out.push(`${key}: rendered "${el.textContent}" ≠ catalogue "${expected}"`)
  }
  return out
}

function strayText(root: HTMLElement): string[] {
  const out: string[] = []
  for (const cap of Array.from(root.querySelectorAll<HTMLElement>('[data-capture]'))) {
    const walker = document.createTreeWalker(cap, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      const value = node.nodeValue ?? ''
      if (!value.trim() || EXEMPT_TEXT.test(value)) continue
      let el: HTMLElement | null = node.parentElement
      let covered = false
      while (el && el !== cap.parentElement) {
        if (el.hasAttribute('data-i18n-key') || el.hasAttribute('data-content')) {
          covered = true
          break
        }
        el = el.parentElement
      }
      if (!covered) out.push(`stray UI text not from catalogue: "${value.trim()}"`)
    }
  }
  return out
}

describe('SF-5094 string-fidelity gate (§3)', () => {
  for (const locale of ['de', 'en'] as const) {
    it(`${locale}: every keyed string matches the catalogue`, () => {
      const { container } = render(<StatesHarness locale={locale} />)
      expect(keyedViolations(container, locale)).toEqual([])
    })

    it(`${locale}: no hardcoded / leaked UI text`, () => {
      const { container } = render(<StatesHarness locale={locale} />)
      expect(strayText(container)).toEqual([])
    })
  }

  it('the clean composer reads "Senden", never "Maskiert senden" (Handoff rule 1)', () => {
    const { container } = render(<StatesHarness locale="de" />)
    const clean = container.querySelector<HTMLElement>('[data-screenshot="clean"] [data-testid="send-button"]')!
    expect(clean.textContent).toBe(formatMessage('composer.send', 'de'))
    expect(clean.textContent).not.toBe(formatMessage('composer.send_redacted', 'de'))
  })

  it('the touched composer reads "Maskiert senden" (§1.1)', () => {
    const { container } = render(<StatesHarness locale="de" />)
    const touched = container.querySelector<HTMLElement>('[data-screenshot="touched"] [data-testid="send-button"]')!
    expect(touched.textContent).toBe(formatMessage('composer.send_redacted', 'de'))
  })
})
