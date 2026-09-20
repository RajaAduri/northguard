import type { InspectionVerdict, Locale } from '../types'
import { buildMirrorModel } from './buildMirrorModel'
import { formatMessage } from '../i18n'

// SF-5024 — the submission mirror: a READ-ONLY mirror of exactly redactedPrompt (FR-08).
// The wire text is rendered verbatim; it is never editable and never re-derived.
export interface SubmissionMirrorProps {
  verdict: InspectionVerdict
  locale: Locale
}

export function SubmissionMirror({ verdict, locale }: SubmissionMirrorProps): JSX.Element {
  const model = buildMirrorModel(verdict)
  return (
    <section data-testid="submission-mirror" aria-readonly="true">
      <header>{formatMessage(model.headerKey, locale)}</header>
      <pre data-testid="wire-text">{model.wireText}</pre>
      <ul>
        {model.rows.map((r, i) => (
          <li key={i} data-area={r.area} data-placeholder={r.placeholder}>
            {formatMessage(r.layerLabelKey, locale, { name: r.ruleId ?? '' })}
          </li>
        ))}
      </ul>
    </section>
  )
}
