import type { BriefingInputs, LedgerEntry, RecurringWorkFinding } from '../../../../lib/types'
import { getLedgerPath } from '../../ledger/append'
import { parseLedgerStream, filterByDateArea, projectSafeFields } from '../../ledger/query'

const MIN_REQUESTS_FOR_BRIEFING = 5

// SF-6021 — gather the deterministic briefing inputs: ledger stats (management
// projection) + E7 recurring-work findings. Insufficient traffic flags the quiet-week
// state; a window spanning a key rotation (>1 keyEpoch) carries a coverage caveat (R5).
// E7 findings are injected — empty until AF-706 lands in Sprint 5 (flagged, not blocking).
export async function gatherBriefingInputs(
  from: string,
  to: string,
  week: string,
  people: number,
  findings: RecurringWorkFinding[] = [],
): Promise<BriefingInputs> {
  const entries: LedgerEntry[] = projectSafeFields(
    await filterByDateArea(parseLedgerStream(getLedgerPath()), { from, to }),
    'management',
  ).filter((e) => e.kind === 'request')

  const stats = {
    requests: entries.length,
    redactedForwarded: entries.filter((e) => e.verdict === 'redact').length,
    blocked: entries.filter((e) => e.verdict === 'block').length,
    rulesOnlyRequests: entries.filter((e) => e.coverage === 'rules-only').length,
  }
  const epochs = new Set<number>()
  for (const e of entries) for (const s of e.spanPseudonyms ?? []) epochs.add(s.keyEpoch)

  const inputs: BriefingInputs = {
    week,
    people,
    stats,
    findings,
    sufficient: stats.requests >= MIN_REQUESTS_FOR_BRIEFING,
  }
  if (epochs.size > 1) {
    inputs.coverageCaveat = 'Der Zeitraum umfasst einen Schlüsselwechsel; wiederkehrende Arbeit wird nicht über den Wechsel hinweg verknüpft.'
  }
  return inputs
}
