import { createHash } from 'node:crypto'
import type { Area, Baseline } from '../../../../lib/types'

function canonicalAreas(areas: Area[]): string {
  return JSON.stringify([...areas].map((a) => ({ id: a.id, label: a.label, mode: a.mode })).sort((x, y) => x.id.localeCompare(y.id)))
}

function nextVersion(prev?: Baseline): string {
  if (!prev) return 'v1.0'
  const m = /^v(\d+)\.(\d+)$/.exec(prev.version)
  if (!m) return 'v1.0'
  return `v${m[1]}.${Number(m[2]) + 1}`
}

// SF-2091 — build a baseline (Schutzprofil configuration item, NG-22). version/date/
// approver/basis/area-set/checksum. The initial baseline has changeRequestId null +
// basis 'initial'; a later one cites its change request.
export function buildBaseline(
  areas: Area[],
  approver: string,
  changeRequestId: string | null,
  prev?: Baseline,
  questionsAnswered?: { q: string; a: string }[],
): Baseline {
  return {
    version: nextVersion(prev),
    createdAt: new Date().toISOString(),
    approver,
    basis: changeRequestId ?? 'initial',
    changeRequestId,
    areas: areas.map((a) => ({ ...a })),
    checksum: createHash('sha256').update(canonicalAreas(areas)).digest('hex').slice(0, 32),
    ...(questionsAnswered ? { questionsAnswered } : {}),
  }
}
