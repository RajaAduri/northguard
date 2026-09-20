import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ThresholdGate, ManagementView } from './ManagementView'
import { buildThresholdModel } from './buildThresholdModel'

afterEach(cleanup)

describe('SF-5084 ThresholdGate / ManagementView (render smoke, jsdom)', () => {
  it('threshold states structural aggregation across N people', () => {
    render(<ThresholdGate model={buildThresholdModel('38', 12)} locale="de" />)
    expect(screen.getByTestId('threshold-body').textContent).toContain('12 Personen')
    expect(screen.getByTestId('threshold-body').textContent).toContain('Keine Namen')
  })
  it('management view exposes no person column (NG-13)', () => {
    render(<ManagementView activeTab="briefing" locale="de" />)
    expect(screen.getByTestId('management-view').getAttribute('data-person-column')).toBe('false')
  })
})
