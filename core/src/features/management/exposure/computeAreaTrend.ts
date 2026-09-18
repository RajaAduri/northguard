import type { Trend } from '../../../../lib/types'

// SF-6012 — classify a weekly series as rising/steady/falling by comparing the second
// half of the window to the first.
export function computeAreaTrend(series: number[]): Trend {
  if (series.length < 2) return 'steady'
  const mid = Math.floor(series.length / 2)
  const first = series.slice(0, mid).reduce((a, b) => a + b, 0)
  const second = series.slice(mid).reduce((a, b) => a + b, 0)
  if (second > first) return 'rising'
  if (second < first) return 'falling'
  return 'steady'
}
