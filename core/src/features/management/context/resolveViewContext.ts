import type { ViewContextModel } from '../../../../lib/types'

// SF-6061 — the two rooms. Management is a document (one 720px column, hairlines,
// Fraunces, no sidebar); the workspace is a tool (dense, cards, teal). Unmistakable
// at a glance (FR-19).
export function resolveViewContext(view: 'workspace' | 'management'): ViewContextModel {
  if (view === 'management') {
    return { view, kind: 'document', typeface: 'Fraunces', maxWidthPx: 720, hairlines: true, sidebar: false, accent: 'none' }
  }
  return { view, kind: 'tool', typeface: 'Inter Tight', maxWidthPx: null, hairlines: false, sidebar: true, accent: 'teal' }
}
