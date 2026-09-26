import type { JSX } from 'react'
import type { InspectionVerdict, Locale } from '../types'
import { buildMirrorModel } from './buildMirrorModel'
import { Msg, Content } from '../i18n'
import { color, radius, text, chip, monoLink } from '../design'

// SF-5024 — the submission mirror (Handoff §1.1 `touched`): a READ-ONLY mirror of exactly
// redactedPrompt (FR-08), rendered verbatim with placeholder chips, an attribution row per
// span (placeholder · layer · area · report), and the "same placeholders, restored
// locally" reassurance (shown by the composer footer). Never editable, never re-derived.
export interface SubmissionMirrorProps {
  verdict: InspectionVerdict
  locale: Locale
}

// Split a wire string into text + ⟨placeholder⟩ chips. textContent is unchanged
// (concatenation), so the FR-08 verbatim-mirror contract holds.
function renderWire(wire: string): JSX.Element[] {
  const parts = wire.split(/(⟨[^⟩]*⟩)/g).filter((p) => p !== '')
  return parts.map((p, i) =>
    /^⟨[^⟩]*⟩$/.test(p) ? (
      <span key={i} style={chip()}>
        {p}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}

export function SubmissionMirror({ verdict, locale }: SubmissionMirrorProps): JSX.Element {
  const model = buildMirrorModel(verdict)
  const areas = model.summary.areas.join(', ')

  return (
    <section
      data-testid="submission-mirror"
      aria-readonly="true"
      style={{
        margin: '0 10px 10px',
        background: color.bgSurface,
        border: `1px solid ${color.touchedBorder}`,
        borderRadius: radius.mirror,
        overflow: 'hidden',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 12px', borderBottom: `1px solid ${color.line}` }}>
        <Msg k={model.headerKey} locale={locale} style={{ ...text.monoSubhead, color: color.amber }} />
        <Msg k="mirror.summary" locale={locale} p={{ n: model.summary.count, areas }} style={{ ...text.monoMeta, color: color.muted }} />
      </header>

      <Content as="p" data-testid="wire-text" style={{ ...text.monoWire, color: color.ink, margin: 0, padding: '10px 12px', whiteSpace: 'pre-wrap' }}>
        {renderWire(model.wireText)}
      </Content>

      <ul style={{ listStyle: 'none', margin: 0, padding: '9px 12px', display: 'grid', gap: 5, borderTop: `1px solid ${color.line}` }}>
        {model.rows.map((r, i) => (
          <li key={i} data-area={r.area} data-placeholder={r.placeholder} style={{ display: 'grid', gridTemplateColumns: '132px auto 1fr auto', gap: 10, alignItems: 'baseline' }}>
            <Content style={chip()}>{r.placeholder}</Content>
            <Msg k={r.layerLabelKey} locale={locale} p={{ name: r.ruleId ?? '' }} style={{ ...text.monoAttribution, color: color.muted }} />
            <Content style={{ ...text.monoAttribution, color: color.muted }}>{r.area}</Content>
            <button type="button" style={monoLink}>
              <Msg k={r.reportActionKey} locale={locale} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
