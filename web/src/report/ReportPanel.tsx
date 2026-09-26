import { useState, type JSX } from 'react'
import type { Locale, ReportForm } from '../types'
import { Msg, Content } from '../i18n'
import { color, radius, text, sendButton, secondaryButton, chip } from '../design'

// SF-5075 — the report form. It replaces the mirror content in the same space (§1.1
// `report`), not a modal. "Kontext freigeben" is an explicit opt-in; the privacy note states
// what the quality lead sees. Submission is handed to the host (→ E6 AF-604, bridge B8).
export interface ReportPanelProps {
  form: ReportForm
  locale: Locale
  onSubmit?: (form: ReportForm) => void
  onCancel?: () => void
}

export function ReportPanel({ form, locale, onSubmit, onCancel }: ReportPanelProps): JSX.Element {
  const [shareContext, setShareContext] = useState(form.shareContext)
  return (
    <section
      data-testid="report-panel"
      style={{ margin: '0 10px 10px', background: color.bgSurface, border: `1px solid ${color.touchedBorder}`, borderRadius: radius.mirror, padding: '10px 12px' }}
    >
      <Msg k="report.title" locale={locale} as="header" style={{ ...text.monoSubhead, color: color.amber, display: 'block', marginBottom: 8 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', marginBottom: 8, ...text.monoAttribution, color: color.muted }}>
        <Msg k="report.span" locale={locale} />
        <Content style={chip()}>{form.faSpan}</Content>
        <Msg k="report.detected_by" locale={locale} />
        <Msg k={form.detectedBy} locale={locale} p={{ name: form.ruleId ?? '' }} />
        <Msg k="report.area" locale={locale} />
        <Content>{form.area}</Content>
      </div>

      <Msg k="report.privacy" locale={locale} as="p" data-testid="report-privacy" style={{ ...text.explain, color: color.muted, margin: '0 0 8px' }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, ...text.explain, color: color.ink }}>
        <input type="checkbox" data-testid="share-context" checked={shareContext} onChange={(e) => setShareContext(e.target.checked)} />
        <Msg k="report.share_context" locale={locale} />
      </label>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" data-testid="report-submit" style={sendButton('amber')} onClick={() => onSubmit?.({ ...form, shareContext })}>
          <Msg k="report.submit" locale={locale} />
        </button>
        <button type="button" style={secondaryButton} onClick={onCancel}>
          <Msg k="report.cancel" locale={locale} />
        </button>
      </div>
    </section>
  )
}
