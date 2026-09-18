import type { AreaExposure } from '../../../../lib/types'

// SF-6013 — order by concentration (touches desc); ties broken stably by area label.
export function orderByConcentration(areas: AreaExposure[]): AreaExposure[] {
  return [...areas].sort((a, b) => b.touches - a.touches || a.area.localeCompare(b.area))
}
