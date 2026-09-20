import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ViewToggle } from './ViewToggle'
import type { WireMessage } from '../types'

afterEach(cleanup)
const wire: WireMessage[] = [{ role: 'user', content: 'Frage zu ⟨Lieferant⟩' }]

describe('SF-5043 ViewToggle (render smoke, jsdom)', () => {
  it('is hidden until the first sent message', () => {
    const { container } = render(<ViewToggle view="own" wire={wire} sentCount={0} locale="de" />)
    expect(container.firstChild).toBeNull()
  })
  it('provider view shows only the wire transcript (NG-1)', () => {
    render(<ViewToggle view="provider" wire={wire} sentCount={1} locale="de" />)
    expect(screen.getByTestId('wire-transcript').textContent).toContain('⟨Lieferant⟩')
    expect(screen.getByTestId('wire-transcript').textContent).not.toContain('Brechtmann')
  })
})
