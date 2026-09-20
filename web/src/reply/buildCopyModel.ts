import type { CopyModel, RestoredSpan } from '../types'

// SF-5032 — the copy line (3s, no toast). When restored values are present the
// clipboard holds real customer data, so the warning + a redacted-copy option are shown.
export function buildCopyModel(restoredSpans: RestoredSpan[]): CopyModel {
  const restoredCount = restoredSpans.length
  return {
    lineKey: 'reply.copied',
    warningKey: restoredCount > 0 ? 'reply.copied_warning' : null,
    redactedKey: 'reply.copy_redacted',
    restoredCount,
  }
}
