import type { ActivityRow } from '../../../../lib/types'

export class AggregationLeakError extends Error {
  constructor() {
    super('NG-13: an activity row must not carry a person dimension (userId)')
    this.name = 'AggregationLeakError'
  }
}

const PERSON_FIELDS = ['userId', 'user', 'actor', 'actorPseudonym', 'username', 'reporter']

// SF-6032 — assert the aggregated rows carry no person dimension (NG-13). The
// management surface has no person column, structurally.
export function applyAggregationGuard(rows: ActivityRow[]): ActivityRow[] {
  for (const row of rows) {
    for (const f of PERSON_FIELDS) {
      if ((row as unknown as Record<string, unknown>)[f] !== undefined) throw new AggregationLeakError()
    }
  }
  return rows
}
