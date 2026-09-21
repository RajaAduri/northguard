import type { ReviewCadence } from '../../../../lib/types'

// SF-6091 — cadence decays with baseline age: fortnightly for the first quarter, then
// monthly, then quarterly. Configurable via an override.
export function resolveCadence(baselineAgeDays: number, override?: ReviewCadence): ReviewCadence {
  if (override) return override
  if (baselineAgeDays < 90) return 'fortnightly'
  if (baselineAgeDays < 180) return 'monthly'
  return 'quarterly'
}
