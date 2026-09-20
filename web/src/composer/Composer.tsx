import type { ComposerState, InspectionVerdict, Locale } from '../types'
import { deriveComposerView } from './deriveComposerView'
import { formatMessage } from '../i18n'
import { color } from '../design'

// SF-5015 — thin composer component over the derived view. Renders the status line +
// send button; the mirror slot (AF-502) sits in a reserved grid row so the layout never
// jumps (Handoff rule 14). Behaviour (reducer/debounce/adapter) is wired by the host.
export interface ComposerProps {
  state: ComposerState
  verdict: InspectionVerdict | null
  degraded?: boolean
  locale: Locale
  onSend?: () => void
}

export function Composer({ state, verdict, degraded = false, locale, onSend }: ComposerProps): JSX.Element {
  const view = deriveComposerView(state, verdict, degraded)
  const toneColor = view.sendTone === 'teal' ? color.teal : view.sendTone === 'amber' ? color.amber : color.line
  return (
    <div data-testid="composer" data-state={view.state}>
      <div role="status" data-testid="composer-status">
        {formatMessage(view.statusKey, locale, { n: verdict?.touchedAreas.length ?? 0 })}
      </div>
      <button
        type="button"
        disabled={view.sendTone === 'disabled'}
        style={{ background: toneColor }}
        onClick={onSend}
      >
        {formatMessage(view.sendLabelKey, locale)}
      </button>
      {degraded ? <div data-testid="degraded-strip">{formatMessage('degraded.title', locale)}</div> : null}
    </div>
  )
}
