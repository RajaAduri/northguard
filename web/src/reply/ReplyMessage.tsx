import type { Locale, RehydrateResult } from '../types'
import { buildReplyView } from './buildReplyView'
import { formatMessage } from '../i18n'

// SF-5034 — renders the locally-restored reply. Restored content is DISPLAY-ONLY and is
// never passed back to forwardToProvider (NG-1) — this component takes the AF-307 result
// and renders it; it has no path to the wire. Unresolved placeholders stay visible.
export interface ReplyMessageProps {
  result: RehydrateResult
  locale: Locale
}

export function ReplyMessage({ result, locale }: ReplyMessageProps): JSX.Element {
  const view = buildReplyView(result)
  return (
    <article data-testid="reply" data-mode={view.mode}>
      <div data-testid="reply-text">{result.restoredText}</div>
      <footer data-testid="reply-footer">
        {formatMessage(view.footerKey, locale, { n: view.restoredCount + view.openCount, k: view.restoredCount })}
        {view.openCount > 0 ? ' · ' + formatMessage('reply.open_placeholder', locale, { n: view.openCount }) : ''}
      </footer>
    </article>
  )
}
