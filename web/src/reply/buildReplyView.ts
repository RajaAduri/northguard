import type { RehydrateResult, ReplyView } from '../types'

// SF-5031 — the reply state from E3 AF-307 output. full = everything restored; partial
// = some placeholders unresolved (stay visible, never guessed — NG-9); not-rendered =
// the provider paraphrased so nothing could be restored.
export function buildReplyView(r: RehydrateResult): ReplyView {
  const restoredCount = r.restoredSpans.length
  const openCount = r.unresolved.length
  if (openCount > 0 && restoredCount === 0) {
    return { mode: 'not-rendered', footerKey: 'reply.not_rendered', openCount, restoredCount }
  }
  if (openCount > 0) {
    return { mode: 'partial', footerKey: 'reply.restored_partial', openCount, restoredCount }
  }
  return { mode: 'full', footerKey: restoredCount === 1 ? 'reply.restored_full_one' : 'reply.restored_full', openCount, restoredCount }
}
