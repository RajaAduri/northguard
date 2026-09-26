import type { JSX } from 'react'
import type { Locale, WireMessage } from '../types'
import { buildWireTranscriptView } from './buildWireTranscriptView'
import { Msg, Content } from '../i18n'
import { color, radius, text, secondaryButton } from '../design'
import { motion } from '../design/motionTokens'

// SF-5043 — "Ihre Sicht / Anbietersicht". The toggle appears only from the first sent
// message (§1.3); the provider view shows ONLY the wire transcript — the one thing that
// leaves the building, including as history (NG-1). Content swaps hard (§2 viewToggle).
export interface ViewToggleProps {
  view: 'own' | 'provider'
  wire: WireMessage[]
  sentCount: number
  locale: Locale
  onToggle?: (next: 'own' | 'provider') => void
}

function tab(active: boolean) {
  return {
    ...secondaryButton,
    borderColor: active ? color.teal : color.line,
    color: active ? color.ink : color.muted,
    transition: `color ${motion.viewToggle.ms}ms ${motion.viewToggle.curve}, border-color ${motion.viewToggle.ms}ms ${motion.viewToggle.curve}`,
  }
}

export function ViewToggle({ view, wire, sentCount, locale, onToggle }: ViewToggleProps): JSX.Element | null {
  if (sentCount === 0) return null // hidden until the first sent message (§1.3)
  const wireView = buildWireTranscriptView(wire)
  return (
    <div data-testid="view-toggle" data-view={view}>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        <button type="button" style={tab(view === 'own')} onClick={() => onToggle?.('own')}>
          <Msg k="header.view_own" locale={locale} />
        </button>
        <button type="button" style={tab(view === 'provider')} onClick={() => onToggle?.('provider')}>
          <Msg k="header.view_provider" locale={locale} />
        </button>
      </div>
      {view === 'provider' ? (
        <section data-testid="wire-transcript" style={{ marginTop: 12, background: color.bgRaised, border: `1px solid ${color.line}`, borderRadius: radius.mirror, padding: 16 }}>
          <Msg k="footnote.provider_view" locale={locale} as="p" style={{ ...text.monoAttribution, color: color.muted, margin: '0 0 10px' }} />
          {wireView.turns.map((t, i) => (
            <Content key={i} as="pre" data-role={t.role} style={{ ...text.monoWire, color: t.role === 'user' ? color.ink : color.muted, margin: '4px 0', whiteSpace: 'pre-wrap' }}>
              {t.content}
            </Content>
          ))}
        </section>
      ) : null}
    </div>
  )
}
