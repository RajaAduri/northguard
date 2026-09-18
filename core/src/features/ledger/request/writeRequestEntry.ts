import type { InspectionVerdict, RequestMeta } from '../../../../lib/types'
import { appendLedgerEntry } from '../append'
import { buildRequestEntry } from './buildRequestEntry'
import { redactBeforeWrite } from './redactBeforeWrite'

// SF-4023 — exactly one entry per request, written before the reply returns (NG-5),
// even on provider failure (FR-14) and in degraded mode (coverage recorded, NG-4).
export async function writeRequestEntry(v: InspectionVerdict, meta: RequestMeta): Promise<string> {
  const entry = redactBeforeWrite(buildRequestEntry(v, meta))
  const { id } = await appendLedgerEntry(entry)
  return id
}
