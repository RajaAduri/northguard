import { useState } from 'react'
import type { Locale, ReportForm } from '../types'
import { formatMessage } from '../i18n'

// SF-5075 — the report form. It replaces the mirror content in the same space (not a
// modal). "Share context" is an explicit opt-in; the privacy note states what the
// quality lead sees. Submission is handed to the host (→ E6 AF-604).
export interface ReportPanelProps {
  form: ReportForm
  locale: Locale
  onSubmit?: (form: ReportForm) => void
}

export function ReportPanel({ form, locale, onSubmit }: ReportPanelProps): JSX.Element {
  const [shareContext, setShareContext] = useState(form.shareContext)
  return (
    <section data-testid="report-panel">
      <header>{formatMessage('report.title', locale)}</header>
      <p data-testid="report-privacy">{formatMessage('report.privacy', locale)}</p>
      <label>
        <input
          type="checkbox"
          data-testid="share-context"
          checked={shareContext}
          onChange={(e) => setShareContext(e.target.checked)}
        />
        {formatMessage('report.share_context', locale)}
      </label>
      <button type="button" onClick={() => onSubmit?.({ ...form, shareContext })}>
        {formatMessage('report.submit', locale)}
      </button>
    </section>
  )
}
