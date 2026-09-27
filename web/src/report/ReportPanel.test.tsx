import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ReportPanel } from './ReportPanel'
import type { ReportForm } from '../types'

afterEach(cleanup)
const form: ReportForm = { faSpan: '⟨Marge⟩', detectedBy: 'mirror.layer_rule', area: 'preise-margen', layer: 'rule', ruleId: 'RULE-PERCENT-PRICE', conversationId: 'c1', shareContext: false }

describe('SF-5075 ReportPanel (render smoke, jsdom)', () => {
  it('renders the privacy note; share-context starts off and submit reflects the toggle', () => {
    const onSubmit = vi.fn()
    render(<ReportPanel form={form} locale="de" onSubmit={onSubmit} />)
    expect(screen.getByTestId('report-privacy').textContent).toContain('Kontext freigeben')
    const box = screen.getByTestId('share-context') as HTMLInputElement
    expect(box.checked).toBe(false)
    fireEvent.click(box)
    fireEvent.click(screen.getByTestId('report-submit'))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ shareContext: true }))
  })
})
