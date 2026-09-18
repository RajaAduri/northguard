import type { Area, AreaMode } from '../../../../lib/types'

// SF-2051 — set one area's mode. Unknown areaId throws.
export function setAreaMode(areas: Area[], areaId: string, mode: AreaMode): Area[] {
  if (!areas.some((a) => a.id === areaId)) throw new Error(`unknown areaId: ${areaId}`)
  return areas.map((a) => (a.id === areaId ? { ...a, mode } : a))
}

// Default any unset mode to 'redact' (conservative but usable — a placeholder still
// lets the model reason, unlike a block).
export function withDefaultModes(areas: Area[]): Area[] {
  return areas.map((a) => (a.mode ? a : { ...a, mode: 'redact' as AreaMode }))
}
