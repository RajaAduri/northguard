import type { Locale, MgmtTab, ThresholdView } from '../types'
import { buildManagementShell } from './buildManagementShell'
import { formatMessage } from '../i18n'

// SF-5084 — ThresholdGate + ManagementView. The threshold is a named, dated screen
// (320ms fade, no slide — handled by AF-506 tokens). The management view is a 720px
// document column with the review nav and NO person column (NG-13).
export interface ThresholdGateProps {
  model: ThresholdView
  locale: Locale
  onEnter?: () => void
}

export function ThresholdGate({ model, locale, onEnter }: ThresholdGateProps): JSX.Element {
  return (
    <section data-testid="threshold">
      <div data-testid="threshold-kicker">{formatMessage(model.kickerKey, locale, { kw: model.week })}</div>
      <h1>{formatMessage(model.headlineKey, locale)}</h1>
      <p data-testid="threshold-body">{formatMessage(model.bodyKey, locale, { n: model.people })}</p>
      <button type="button" onClick={onEnter}>{formatMessage(model.enterKey, locale)}</button>
    </section>
  )
}

export interface ManagementViewProps {
  activeTab: MgmtTab
  locale: Locale
}

export function ManagementView({ activeTab, locale }: ManagementViewProps): JSX.Element {
  const shell = buildManagementShell(activeTab)
  return (
    <main data-testid="management-view" data-person-column={String(shell.hasPersonColumn)} style={{ maxWidth: shell.maxWidthPx, fontFamily: shell.typeface }}>
      <nav>
        {shell.navKeys.map((k) => (
          <span key={k} data-nav={k}>{formatMessage(k, locale)}</span>
        ))}
      </nav>
    </main>
  )
}
