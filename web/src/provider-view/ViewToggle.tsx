import type { Locale, WireMessage } from '../types'
import { buildWireTranscriptView } from './buildWireTranscriptView'
import { formatMessage } from '../i18n'

// SF-5043 — "Ihre Sicht / Anbietersicht". The toggle appears only from the first sent
// message; the provider view shows ONLY the wire transcript (NG-1). Content swaps hard.
export interface ViewToggleProps {
  view: 'own' | 'provider'
  wire: WireMessage[]
  sentCount: number // the toggle is hidden until the first sent message
  locale: Locale
  onToggle?: (next: 'own' | 'provider') => void
}

export function ViewToggle({ view, wire, sentCount, locale, onToggle }: ViewToggleProps): JSX.Element | null {
  if (sentCount === 0) return null // hidden until the first sent message (§1.3)
  const wireView = buildWireTranscriptView(wire)
  return (
    <div data-testid="view-toggle" data-view={view}>
      <button type="button" onClick={() => onToggle?.('own')}>{formatMessage('header.view_own', locale)}</button>
      <button type="button" onClick={() => onToggle?.('provider')}>{formatMessage('header.view_provider', locale)}</button>
      {view === 'provider' ? (
        <div data-testid="wire-transcript">
          {wireView.turns.map((t, i) => (
            <pre key={i} data-role={t.role}>{t.content}</pre>
          ))}
        </div>
      ) : null}
    </div>
  )
}
