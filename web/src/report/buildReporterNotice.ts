import type { ReporterNoticeView } from '../types'

// SF-5074 — the quiet in-conversation notice (not a notification centre — rule 8/13).
// Every report gets a reply, even a "no" (declined carries the reasoning).
export function buildReporterNotice(state: 'pending' | 'applied' | 'declined'): ReporterNoticeView {
  const messageKey = state === 'pending' ? 'notice.pending' : state === 'applied' ? 'notice.applied' : 'notice.declined'
  return { state, messageKey }
}
