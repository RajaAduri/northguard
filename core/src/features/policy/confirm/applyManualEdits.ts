import type { Area, AreaEdit } from '../../../../lib/types'

function joinProvenance(...parts: (string | undefined)[]): string | undefined {
  const kept = parts.filter((p): p is string => p !== undefined && p.length > 0)
  return kept.length > 0 ? kept.join(' + ') : undefined
}

// SF-2042 — apply rename/merge/split/remove. rename keeps the id; merge combines
// provenance into one area; split replaces one area with two; remove drops it.
export function applyManualEdits(areas: Area[], edits: AreaEdit[]): Area[] {
  let out = areas.map((a) => ({ ...a }))
  for (const edit of edits) {
    switch (edit.kind) {
      case 'rename': {
        out = out.map((a) => (a.id === edit.areaId && edit.label ? { ...a, label: edit.label } : a))
        break
      }
      case 'remove': {
        out = out.filter((a) => a.id !== edit.areaId)
        break
      }
      case 'merge': {
        const base = out.find((a) => a.id === edit.areaId)
        if (!base) break
        const mergedIds = new Set(edit.intoIds ?? [])
        const merged = out.filter((a) => mergedIds.has(a.id))
        const provenance = joinProvenance(base.provenance, ...merged.map((m) => m.provenance))
        out = out
          .filter((a) => !mergedIds.has(a.id))
          .map((a) => (a.id === edit.areaId ? { ...a, ...(provenance ? { provenance } : {}) } : a))
        break
      }
      case 'split': {
        const idx = out.findIndex((a) => a.id === edit.areaId)
        if (idx < 0 || !edit.splitLabels) break
        const src = out[idx] as Area
        const parts: Area[] = edit.splitLabels.map((label, i) => ({
          ...src,
          id: `${src.id}:${i + 1}`,
          label,
        }))
        out = [...out.slice(0, idx), ...parts, ...out.slice(idx + 1)]
        break
      }
    }
  }
  return out
}
