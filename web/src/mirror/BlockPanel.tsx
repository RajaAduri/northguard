import type { JSX } from 'react'
import type { InspectionVerdict, Locale, RedactionSpan } from '../types'
import { buildBlockModel } from './buildBlockModel'
import { ruleDisplayName } from './ruleDisplayName'
import { Msg } from '../i18n'
import { color, radius, text, secondaryButton, monoLink } from '../design'

// SF-5025 — the blocked variant of the mirror (Handoff §1.1 `blocked`). No submission is
// offered. The body names the AREA that fired (it does not echo the detected value — for
// credentials that would defeat the block) and states there is NO per-prompt approval
// (rule 7). Each detected span is attributed by its layer (Regel „…“ / KI-Prüfung). The way
// out is remove-and-rephrase or report — both here.
export interface BlockPanelProps {
  verdict: InspectionVerdict
  locale: Locale
  onReport?: (span: RedactionSpan) => void
}

export function BlockPanel({ verdict, locale, onReport }: BlockPanelProps): JSX.Element {
  const model = buildBlockModel(verdict)
  const areas = model.areas.join(', ')

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

      <Msg k="block.body" locale={locale} p={{ area: areas }} as="p" style={{ ...text.explain, color: color.ink, margin: '0 0 8px' }} />

      <ul style={{ listStyle: 'none', margin: '0 0 8px', padding: 0, display: 'grid', gap: 4 }}>
        {model.detected.map((d, i) => (
          <li key={i} style={{ ...text.monoAttribution, color: color.muted }}>
            <Msg k={d.layerLabelKey} locale={locale} p={{ name: ruleDisplayName(d.ruleId, locale) }} />
          </li>
        ))}
      </ul>

      <Msg k="block.ledger_note" locale={locale} as="p" style={{ ...text.monoAttribution, color: color.muted, margin: '0 0 8px' }} />
      <Msg k="block.no_approval" locale={locale} as="p" style={{ ...text.explain, color: color.muted, margin: '0 0 10px' }} />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" style={secondaryButton}>
          <Msg k="block.remove" locale={locale} />
        </button>
        <button type="button" style={monoLink} onClick={() => onReport?.(verdict.spans[0]!)}>
          <Msg k="block.report" locale={locale} />
        </button>
      </div>
    </section>
  )
}
