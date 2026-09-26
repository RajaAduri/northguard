import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { renderMarkdown } from './renderMarkdown'

afterEach(cleanup)

const decor = {
  restoredValues: ['Brechtmann GmbH'],
  chip: (t: string, k: string) => <span key={k} data-chip="">{t}</span>,
  restored: (v: string, k: string) => <span key={k} data-restored="">{v}</span>,
}

describe('SF-5037 renderMarkdown (F1)', () => {
  it('renders headings, bold, unordered + ordered lists, and code', () => {
    const md = '# Titel\n\nEin **wichtiger** Punkt und `code`.\n\n- eins\n- zwei\n\n1. a\n2. b\n\n```\nblock\n```'
    const { container } = render(<div>{renderMarkdown(md, decor)}</div>)
    expect(container.querySelector('strong')?.textContent).toBe('wichtiger')
    expect(container.querySelectorAll('ul li').length).toBe(2)
    expect(container.querySelectorAll('ol li').length).toBe(2)
    expect(container.querySelector('code')?.textContent).toBe('code')
    expect(container.querySelector('pre')?.textContent).toBe('block')
    expect(container.textContent).toContain('Titel')
  })

  it('keeps ⟨…⟩ chips and rehydrated values as distinct runs (NG-25)', () => {
    const { container } = render(<div>{renderMarkdown('Von Brechtmann GmbH an ⟨E-Mail-Adresse⟩.', decor)}</div>)
    expect(container.querySelector('[data-chip]')?.textContent).toBe('⟨E-Mail-Adresse⟩')
    expect(container.querySelector('[data-restored]')?.textContent).toBe('Brechtmann GmbH')
  })

  it('does not emit raw HTML (no injection)', () => {
    const { container } = render(<div>{renderMarkdown('<img src=x onerror=alert(1)>', decor)}</div>)
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('<img')
  })
})
