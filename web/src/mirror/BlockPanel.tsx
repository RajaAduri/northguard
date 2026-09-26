import type { JSX } from 'react'
import type { InspectionVerdict, Locale } from '../types'
import { buildBlockModel } from './buildBlockModel'
import { Msg, Content, formatMessage } from '../i18n'
import { color, radius, text, secondaryButton, monoLink } from '../design'

// SF-5025 — the blocked variant of the mirror (Handoff §1.1 `blocked`). No submission is
// offered; the panel quotes the detected spans with their layer, reassures that only
// time/area/layer reach the ledger (not the text), and states there is NO per-prompt
// approval (rule 7). The way out is remove-and-rephrase or report — both here.
export interface BlockPanelProps {
  verdict: InspectionVerdict
  locale: Locale
  onSend?: () => void
}

export function BlockPanel({ verdict, locale }: BlockPanelProps): JSX.Element {
  const model = buildBlockModel(verdict)
  const areas = model.areas.join(', ')
  const spans = model.detected.map((d) => `„${d.value}“`).join(` ${formatMessage('block.body_join', locale)} `)

  return (
    <section
      data-testid="block-panel"
      style={{
        margin: '0 10px 10px',
        background: color.bgSurface,
        border: `1px solid ${color.blockedBorder}`,
        borderRadius: radius.mirror,
        padding: '10px 12px',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: radius.chip, background: color.red, flex: '0 0 auto' }} />
        <Msg k="block.title" locale={locale} style={{ ...text.monoSubhead, color: color.red }} />
        <Msg k="block.summary" locale={locale} p={{ area: areas }} style={{ ...text.monoMeta, color: color.muted }} />
      </header>

      <Msg k="block.body" locale={locale} p={{ spans }} as="p" style={{ ...text.explain, color: color.ink, margin: '0 0 8px' }} />

      <ul style={{ listStyle: 'none', margin: '0 0 8px', padding: 0 }}>
        {model.detected.map((d, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, ...text.monoAttribution, color: color.muted }}>
            <Content style={{ color: color.red }}>„{d.value}“</Content>
            <Msg k={d.layerLabelKey} locale={locale} p={{ name: d.ruleId ?? '' }} />
          </li>
        ))}
      </ul>

      <Msg k="block.ledger_note" locale={locale} as="p" style={{ ...text.monoAttribution, color: color.muted, margin: '0 0 8px' }} />
      <Msg k="block.no_approval" locale={locale} as="p" style={{ ...text.explain, color: color.muted, margin: '0 0 10px' }} />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" style={secondaryButton}>
          <Msg k="block.remove" locale={locale} />
        </button>
        <button type="button" style={monoLink}>
          <Msg k="block.report" locale={locale} />
        </button>
      </div>
    </section>
  )
}
